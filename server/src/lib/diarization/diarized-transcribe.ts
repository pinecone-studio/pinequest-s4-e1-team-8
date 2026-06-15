import { transcribeAudio } from "../../controllers/meetingTranscription/chimege-client";
import { indexMp3Frames, sliceMp3ByTime } from "../audio/mp3-splitter";
import { getAcousticDiarization } from "../gemini/meeting-analysis";
import { mergeSegments } from "./merge-segments";
import type { Bindings } from "../common/types";

export interface DiarizedSegment {
  speakerLabel: string; // e.g. "Илтгэгч 1"
  speaker: number;
  text: string;
  startSec: number;
  endSec: number;
}

export interface DiarizedTranscript {
  segments: DiarizedSegment[];
  transcript: string; // "Илтгэгч 1: ...\nИлтгэгч 2: ..."
  speakerCount: number;
}

// Mongolian speaker label, matching the convention already used in the Gemini
// prompts (meeting-analysis.ts).
const speakerLabel = (n: number) => `Илтгэгч ${n}`;

// Full diarized-STT pipeline for one MP3 recording:
//   1. Gemini acoustic diarization → speaker turns with timestamps (no STT)
//   2. merge same-speaker turns + drop tiny fragments (limits Chimege calls)
//   3. frame-slice the MP3 per merged segment
//   4. Chimege STT on each chunk → speaker-attributed text
//
// Returns labelled segments + a flat speaker-prefixed transcript. The Chimege
// calls run sequentially to stay gentle on STT rate limits.
//
// `audio` must be MP3 (egress emits MP3; standalone WebM is transcoded to MP3
// upstream before this runs).
export const diarizedTranscribe = async (
  env: Bindings,
  audio: ArrayBuffer,
): Promise<DiarizedTranscript> => {
  if (!env.GEMINI_API_KEY?.trim()) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const frameIndex = indexMp3Frames(audio);
  const rawSegments = await getAcousticDiarization(env, audio, "audio/mpeg");

  if (rawSegments.length === 0) {
    // No speaker turns at all — usually near-silent or non-speech audio.
    throw new Error("Diarization returned no speaker turns (silent or non-speech audio?)");
  }

  const merged = mergeSegments(rawSegments, {
    totalDurationSec: frameIndex.totalDurationSec,
  });

  if (merged.length === 0) {
    // We had raw turns but the merge/trim dropped them all (every turn shorter
    // than the minimum). Surface the raw count so it's diagnosable.
    throw new Error(
      `Diarization produced ${rawSegments.length} turns but all were below the minimum duration`,
    );
  }

  const segments: DiarizedSegment[] = [];

  for (const segment of merged) {
    const chunk = sliceMp3ByTime(
      audio,
      frameIndex,
      segment.startSec,
      segment.endSec,
    );

    let text = "";
    try {
      text = (
        await transcribeAudio(chunk, env.CHIMEGE_API_KEY, {
          baseUrl: env.CHIMEGE_BASE_URL,
          filename: `segment-${segment.index}.mp3`,
          mimeType: "audio/mpeg",
        })
      ).trim();
    } catch (error) {
      // A single bad chunk shouldn't sink the whole recording — log and skip it
      // so the rest of the transcript still comes through.
      console.warn("[diarization] Chimege failed on a segment; skipping", {
        index: segment.index,
        speaker: segment.speaker,
        error: (error as Error).message,
      });
      continue;
    }

    if (!text) continue;

    segments.push({
      speakerLabel: speakerLabel(segment.speaker),
      speaker: segment.speaker,
      text,
      startSec: segment.startSec,
      endSec: segment.endSec,
    });
  }

  if (segments.length === 0) {
    throw new Error("Diarized transcription produced no text from any segment");
  }

  const transcript = segments.map((s) => `${s.speakerLabel}: ${s.text}`).join("\n");
  const speakerCount = new Set(segments.map((s) => s.speaker)).size;

  return { segments, transcript, speakerCount };
};
