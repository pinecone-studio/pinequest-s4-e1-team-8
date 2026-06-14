import type { Bindings } from "../common/types";
import {
  generateGeminiJson,
  generateGeminiJsonFromAudio,
} from "./gemini-client";

const SUMMARY_PROMPT_PREFIX =
  "Summarize the following meeting transcript. Respond in Mongolian. " +
  "Return ONLY a JSON object (no markdown, no commentary) with this exact shape:\n" +
  '{"mainTopics": string[], "keyDecisions": string[], "actionItems": { "owner": string, "action": string }[]}\n\n' +
  '"mainTopics" lists the main topics discussed, "keyDecisions" lists the key decisions made, ' +
  'and "actionItems" lists the assigned action items, each with the responsible person\'s name in "owner" ' +
  '(use "Тодорхойгүй" if no owner is mentioned) and the task description in "action".\n\n';

const SUMMARY_PROMPT_SUFFIX =
  "\n\nIMPORTANT: Always respond in Mongolian language.";

const SEGMENTS_PROMPT_PREFIX =
  "Split the following meeting transcript into per-speaker dialogue segments. " +
  "Respond in Mongolian. " +
  "Return ONLY a JSON object (no markdown, no commentary) with this exact shape:\n" +
  '{"segments": [{ "speakerName": string, "text": string, "timestampSeconds": number }]}\n\n' +
  '"speakerName" must match one of the provided participant names as closely as ' +
  'possible (use "Тодорхойгүй" if no participant name matches), "text" is the verbatim ' +
  'text spoken during that turn, and "timestampSeconds" is the estimated number of ' +
  'seconds from the start of the meeting when that turn began. Segments must be ordered ' +
  'by "timestampSeconds" ascending, starting at 0.\n\n';

const SEGMENTS_PROMPT_SUFFIX =
  "\n\nIMPORTANT: Always respond in Mongolian language.";

const STANDALONE_PROMPT_PREFIX =
  "Analyze the following audio transcript. Respond in Mongolian. " +
  "Return ONLY a JSON object (no markdown, no commentary) with this exact shape:\n" +
  '{"speakerCount": number, "keyPoints": string[], "segments": { "speakerLabel": string, "text": string }[]}\n\n' +
  '"speakerCount" is your best estimate of how many distinct people speak in the ' +
  'transcript. "keyPoints" lists the main points or takeaways as 2 to 6 short ' +
  'bullet points — never return an empty array; for very short recordings, ' +
  'summarize whatever was said in at least one point. "segments" splits the ' +
  'transcript into chronological dialogue turns, where "speakerLabel" identifies the ' +
  'speaker as "Илтгэгч 1", "Илтгэгч 2", and so on (numbered in the order each new ' +
  'speaker first talks), and "text" is the verbatim text spoken during that turn. ' +
  "Segments must stay in chronological order.\n\n";

const STANDALONE_PROMPT_SUFFIX =
  "\n\nIMPORTANT: Always respond in Mongolian language.";

async function requestCompletion(
  bindings: Bindings,
  prompt: string,
): Promise<string> {
  return generateGeminiJson(bindings, { userPrompt: prompt });
}

const getParticipantsSection = (participantNames?: string[] | null) =>
  participantNames?.length
    ? `Meeting participants: ${participantNames.join(", ")}\n\n`
    : "";

export async function generateMeetingSummary(
  bindings: Bindings,
  transcript: string,
  participantNames?: string[] | null,
): Promise<string> {
  const participantsSection = getParticipantsSection(participantNames);

  return requestCompletion(
    bindings,
    `${SUMMARY_PROMPT_PREFIX}${participantsSection}Transcript:\n${transcript}${SUMMARY_PROMPT_SUFFIX}`,
  );
}

export async function generateTranscriptSegments(
  bindings: Bindings,
  transcript: string,
  participantNames?: string[] | null,
): Promise<string> {
  const participantsSection = getParticipantsSection(participantNames);

  return requestCompletion(
    bindings,
    `${SEGMENTS_PROMPT_PREFIX}${participantsSection}Transcript:\n${transcript}${SEGMENTS_PROMPT_SUFFIX}`,
  );
}

const ACOUSTIC_SPEAKER_COUNT_PROMPT = `Listen to this audio carefully. Do NOT transcribe or interpret the words — judge ONLY the physical voice characteristics: pitch, timbre, vocal resonance, and speaking style.

Your task: count how many UNIQUE human speakers are in this single recording.

Counting rules — follow them strictly:
- A "speaker" is a distinct vocal identity. The SAME person can sound different across the recording — louder/softer, calm/excited, laughing, closer/farther from the mic, or over a phone. Do NOT split one person into multiple speakers because their tone or volume changed.
- Do NOT create a new speaker for brief backchannels or fillers (e.g. "тийм", "за", " за за", "ok", "mhm", "aha"), laughter, coughs, or background noise. Only count a voice if it clearly speaks as its own person.
- Two segments should be treated as DIFFERENT speakers only when their pitch and timbre are clearly distinguishable.
- When you are genuinely unsure whether two segments are the same person or two people, assume they are the SAME person. Prefer the smaller, most confident count — it is better to undercount than to invent speakers that may not exist.
- Ignore music, jingles, TV/radio in the background, and synthesized/announcement voices unless they are clearly part of the conversation.

First think through the distinct voices you can actually distinguish, then commit to a final number.

Respond ONLY with a JSON object matching this schema (no markdown, no extra text):
{
  "reasoning": string,   // one short sentence: the distinct voices you identified and your confidence
  "speakerCount": number // your final, conservative count of unique speakers
}`;

// Acoustic speaker diarization: feeds the raw audio to Gemini and asks it to
// count distinct voices by sound (tone/pitch/timbre) rather than inferring from
// the flat Chimege transcript — which over-counts when speakers interrupt or
// interject. Returns `null` on any failure so the caller can fall back to the
// text-based estimate instead of clobbering it with a magic number.
export async function getAcousticSpeakerCount(
  bindings: Bindings,
  audio: ArrayBuffer | Uint8Array,
  mimeType: string,
): Promise<number | null> {
  try {
    const raw = await generateGeminiJsonFromAudio(bindings, {
      audio,
      mimeType,
      prompt: ACOUSTIC_SPEAKER_COUNT_PROMPT,
    });

    const parsed = JSON.parse(raw) as { speakerCount?: unknown };

    if (typeof parsed.speakerCount !== "number" || !Number.isFinite(parsed.speakerCount)) {
      return null;
    }

    return Math.max(1, Math.round(parsed.speakerCount));
  } catch (error) {
    console.warn("[recordings] Acoustic speaker count failed", {
      error: (error as Error).message,
    });
    return null;
  }
}

const getSpeakerCountConstraint = (speakerCount?: number | null) =>
  speakerCount && speakerCount > 0
    ? `This recording has EXACTLY ${speakerCount} distinct speaker(s), determined by acoustic analysis. ` +
      `You MUST use exactly ${speakerCount} distinct "speakerLabel" value(s) — "Илтгэгч 1"` +
      (speakerCount > 1 ? ` through "Илтгэгч ${speakerCount}"` : "") +
      `. Set "speakerCount" to ${speakerCount}. Do NOT invent more speakers than this, ` +
      `even if speakers interrupt each other or give short interjections.\n\n`
    : "";

// Single Gemini call for the standalone Voice Recordings feature: estimates the
// speaker count, extracts key points, and splits the flat transcript into
// labelled dialogue segments. Returns the raw JSON text. When a `speakerCount`
// is provided (from acoustic diarization), it is passed as a hard constraint so
// Gemini labels exactly that many speakers instead of inventing ghost speakers.
export async function generateStandaloneAnalysis(
  bindings: Bindings,
  transcript: string,
  speakerCount?: number | null,
): Promise<string> {
  return requestCompletion(
    bindings,
    `${STANDALONE_PROMPT_PREFIX}${getSpeakerCountConstraint(speakerCount)}Transcript:\n${transcript}${STANDALONE_PROMPT_SUFFIX}`,
  );
}
