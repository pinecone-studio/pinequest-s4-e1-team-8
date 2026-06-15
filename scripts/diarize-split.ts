#!/usr/bin/env bun
/**
 * Speaker diarization + audio-splitting pipeline.
 *
 * Flow:
 *   1. Take a local multi-speaker audio file.
 *   2. Send it to AssemblyAI for diarization (speaker timestamps only — we ignore text).
 *   3. Parse the JSON response into speaker segments.
 *   4. Slice the original audio into one chunk per segment using ffmpeg.
 *   5. Name chunks sequentially: talk1_speaker1.mp3, talk2_speaker2.mp3, ...
 *   6. Hand each chunk to a placeholder "second API" forwarder.
 *
 * Run:
 *   bun run scripts/diarize-split.ts ./path/to/meeting.mp3
 *
 * Requirements:
 *   - ffmpeg available on PATH (see install commands at the bottom of this file).
 *   - ASSEMBLYAI_API_KEY in the environment (Bun auto-loads .env).
 */

import { $ } from "bun";
import { basename, extname, join } from "node:path";
import { mkdir } from "node:fs/promises";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ASSEMBLYAI_BASE = "https://api.assemblyai.com/v2";

/**
 * API KEY GOES HERE (via environment, not hard-coded).
 * Put this in a `.env` file at the project root — Bun loads it automatically:
 *
 *   ASSEMBLYAI_API_KEY=your_key_here
 *
 * Get a key at https://www.assemblyai.com/ (free tier available).
 */
const API_KEY = process.env.ASSEMBLYAI_API_KEY;

const OUTPUT_DIR = "./diarized_chunks";
const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 10 * 60 * 1_000; // 10 minutes

// ---------------------------------------------------------------------------
// Types (only the fields we actually use from the API response)
// ---------------------------------------------------------------------------

interface Utterance {
  speaker: string; // e.g. "A", "B", "C"
  start: number; // milliseconds
  end: number; // milliseconds
}

interface TranscriptResponse {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  error?: string;
  utterances?: Utterance[] | null;
}

interface Segment {
  index: number; // 1-based order of appearance
  speaker: number; // normalized 1-based speaker number
  startSec: number;
  endSec: number;
  outputPath: string;
}

// ---------------------------------------------------------------------------
// Small fetch helper with clear error surfacing
// ---------------------------------------------------------------------------

async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${ASSEMBLYAI_BASE}${path}`, {
    ...init,
    headers: { authorization: API_KEY!, ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "<no body>");
    throw new Error(`AssemblyAI ${path} failed: ${res.status} ${res.statusText} — ${body}`);
  }
  return res;
}

// ---------------------------------------------------------------------------
// Step 2a: upload the local file so AssemblyAI can reach it
// ---------------------------------------------------------------------------

async function uploadAudio(filePath: string): Promise<string> {
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    throw new Error(`Input file not found: ${filePath}`);
  }

  console.log(`Uploading "${filePath}" ...`);
  const res = await api("/upload", {
    method: "POST",
    headers: { "content-type": "application/octet-stream" },
    body: file, // Bun streams the file directly
  });

  const { upload_url } = (await res.json()) as { upload_url: string };
  return upload_url;
}

// ---------------------------------------------------------------------------
// Step 2b + 3: request diarization, poll, return parsed segments
// ---------------------------------------------------------------------------

async function diarize(audioUrl: string): Promise<Utterance[]> {
  // speaker_labels: true is the diarization switch. We still get a transcript
  // back, but we simply never read the `text` field — we only want timings.
  console.log("Requesting diarization ...");
  const createRes = await api("/transcript", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ audio_url: audioUrl, speaker_labels: true }),
  });

  const { id } = (await createRes.json()) as TranscriptResponse;
  console.log(`Transcript job created: ${id}. Polling for completion ...`);

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const poll = (await (await api(`/transcript/${id}`)).json()) as TranscriptResponse;

    if (poll.status === "completed") {
      const utterances = poll.utterances ?? [];
      if (utterances.length === 0) {
        throw new Error("Diarization completed but returned no speaker segments.");
      }
      return utterances;
    }
    if (poll.status === "error") {
      throw new Error(`Diarization failed: ${poll.error ?? "unknown error"}`);
    }

    process.stdout.write(".");
    await Bun.sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Diarization timed out after ${POLL_TIMEOUT_MS / 1000}s.`);
}

// ---------------------------------------------------------------------------
// Step 4 + 5: cut the audio into one file per segment, named sequentially
// ---------------------------------------------------------------------------

async function sliceAudio(inputPath: string, utterances: Utterance[]): Promise<Segment[]> {
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Map AssemblyAI's letter labels ("A", "B", ...) to stable 1-based numbers.
  const speakerNumbers = new Map<string, number>();
  const numberFor = (label: string): number => {
    if (!speakerNumbers.has(label)) speakerNumbers.set(label, speakerNumbers.size + 1);
    return speakerNumbers.get(label)!;
  };

  const segments: Segment[] = [];

  for (const [i, utt] of utterances.entries()) {
    const index = i + 1; // talk1, talk2, ...
    const speaker = numberFor(utt.speaker);
    const startSec = utt.start / 1000;
    const endSec = utt.end / 1000;
    const duration = endSec - startSec;

    if (duration <= 0) {
      console.warn(`Skipping segment ${index}: non-positive duration (${duration}s).`);
      continue;
    }

    const outputPath = join(OUTPUT_DIR, `talk${index}_speaker${speaker}.mp3`);

    // -ss before -i = fast seek; re-encode to mp3 so cut points are sample-accurate.
    try {
      await $`ffmpeg -y -ss ${startSec} -i ${inputPath} -t ${duration} -c:a libmp3lame -q:a 2 ${outputPath}`.quiet();
    } catch (err) {
      throw new Error(`ffmpeg failed on segment ${index} (${outputPath}): ${err}`);
    }

    console.log(`  ✓ ${outputPath}  [speaker ${speaker}, ${startSec.toFixed(2)}s–${endSec.toFixed(2)}s]`);
    segments.push({ index, speaker, startSec, endSec, outputPath });
  }

  return segments;
}

// ---------------------------------------------------------------------------
// Step 6: placeholder forwarder to a second API
// ---------------------------------------------------------------------------

/**
 * Forward each produced chunk to your downstream API (e.g. STT, classifier, etc.).
 * Replace the body with your real request. Returns whatever you need per chunk.
 */
async function forwardToSecondApi(segment: Segment): Promise<void> {
  // ---- SECOND API KEY GOES HERE (read from env, don't hard-code) ----
  // const SECOND_API_KEY = process.env.SECOND_API_KEY;

  const audio = Bun.file(segment.outputPath);

  // Example skeleton — uncomment and adapt:
  //
  // const res = await fetch("https://your-second-api.example.com/process", {
  //   method: "POST",
  //   headers: { authorization: SECOND_API_KEY! },
  //   body: audio,
  // });
  // if (!res.ok) throw new Error(`Second API failed for ${segment.outputPath}: ${res.status}`);
  // const result = await res.json();
  // console.log(result);

  console.log(`[forward] would send ${segment.outputPath} (${(audio.size / 1024).toFixed(1)} KB) to second API`);
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error("Usage: bun run scripts/diarize-split.ts <audio-file>");
    process.exit(1);
  }
  if (!API_KEY) {
    console.error("Missing ASSEMBLYAI_API_KEY. Add it to your .env file.");
    process.exit(1);
  }

  // Fail fast if ffmpeg isn't installed.
  try {
    await $`ffmpeg -version`.quiet();
  } catch {
    console.error("ffmpeg not found on PATH. See install instructions at the bottom of this script.");
    process.exit(1);
  }

  try {
    const uploadUrl = await uploadAudio(inputPath);
    const utterances = await diarize(uploadUrl);
    console.log(`\nGot ${utterances.length} speaker segments. Slicing "${basename(inputPath)}" ...`);

    const segments = await sliceAudio(inputPath, utterances);
    console.log(`\nCreated ${segments.length} chunk(s) in ${OUTPUT_DIR}.\n`);

    console.log("Forwarding chunks to second API ...");
    for (const seg of segments) {
      await forwardToSecondApi(seg);
    }

    console.log("\nDone.");
  } catch (err) {
    console.error(`\nPipeline error: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

main();

/* ---------------------------------------------------------------------------
 * INSTALL / SETUP
 * ---------------------------------------------------------------------------
 *
 * 1. ffmpeg (system binary):
 *      Windows:  winget install Gyan.FFmpeg      (or: choco install ffmpeg)
 *      macOS:    brew install ffmpeg
 *      Linux:    sudo apt-get install -y ffmpeg
 *
 * 2. No npm packages are strictly required — this uses Bun's built-in
 *    fetch, Bun.file, and Bun.$ shell. (If you prefer Node + fluent-ffmpeg
 *    instead of Bun.$, run:  bun add fluent-ffmpeg @types/fluent-ffmpeg)
 *
 * 3. Create a .env file at the project root:
 *      ASSEMBLYAI_API_KEY=your_key_here
 *
 * 4. Run:
 *      bun run scripts/diarize-split.ts ./meeting.mp3
 * ------------------------------------------------------------------------- */
