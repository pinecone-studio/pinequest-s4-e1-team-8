import { and, desc, eq } from "drizzle-orm";
import { standaloneRecordings } from "../../schema/recordings.schema";
import { generateKeyPoints } from "../../lib/gemini/meeting-analysis";
import { diarizedTranscribe } from "../../lib/diarization/diarized-transcribe";
import { indexMp3Frames } from "../../lib/audio/mp3-splitter";
import { isWebmContainer, transcodeWebmToMp3 } from "../../lib/audio/webm-to-mp3";
import opusModule from "../../lib/audio/opus-wasm";
import { useDB } from "../../lib/db/db";
import type { Bindings } from "../../lib/common/types";

type RecordingsDb = ReturnType<typeof useDB>;

const getRuntimeLogContext = (env: Bindings) => ({
  database: env.D1_DATABASE_NAME ?? "unknown",
  environment: env.ENVIRONMENT ?? "unknown",
});

// R2 object key for a user's recording. Stored verbatim in `audioUrl` and used
// to fetch the asset back in the queue consumer.
export const buildRecordingKey = (userId: string, recordingId: string) =>
  `recordings/${userId}/${recordingId}.mp3`;

export const createStandaloneRecording = async ({
  db,
  id,
  userId,
  title,
  audioUrl,
  fileSizeBytes,
  durationSeconds,
}: {
  db: RecordingsDb;
  id: string;
  userId: string;
  title: string;
  audioUrl: string;
  fileSizeBytes?: number;
  durationSeconds?: number;
}) => {
  await db.insert(standaloneRecordings).values({
    id,
    userId,
    title,
    audioUrl,
    status: "processing",
    fileSizeBytes,
    durationSeconds,
  });
};

export const findRecordingById = async (db: RecordingsDb, id: string) =>
  db
    .select()
    .from(standaloneRecordings)
    .where(eq(standaloneRecordings.id, id))
    .get();

export const findRecordingForUser = async (
  db: RecordingsDb,
  id: string,
  userId: string,
) =>
  db
    .select()
    .from(standaloneRecordings)
    .where(
      and(
        eq(standaloneRecordings.id, id),
        eq(standaloneRecordings.userId, userId),
      ),
    )
    .get();

export const listRecordingsForUser = async (
  db: RecordingsDb,
  userId: string,
) =>
  db
    .select()
    .from(standaloneRecordings)
    .where(eq(standaloneRecordings.userId, userId))
    .orderBy(desc(standaloneRecordings.createdAt))
    .all();

export const markRecordingFailed = async (
  db: RecordingsDb,
  id: string,
  errorMessage: string,
) => {
  await db
    .update(standaloneRecordings)
    .set({ status: "failed", errorMessage })
    .where(eq(standaloneRecordings.id, id));
};

const inferMp3DurationSeconds = (audioBuffer: ArrayBuffer) => {
  try {
    return Math.max(1, Math.round(indexMp3Frames(audioBuffer).totalDurationSec));
  } catch {
    return null;
  }
};

export const deleteRecordingForUser = async (
  env: Bindings,
  db: RecordingsDb,
  id: string,
  userId: string,
) => {
  const recording = await findRecordingForUser(db, id, userId);

  if (!recording) {
    return false;
  }

  await env.R2_BUCKET.delete(recording.audioUrl);
  await db
    .delete(standaloneRecordings)
    .where(
      and(
        eq(standaloneRecordings.id, id),
        eq(standaloneRecordings.userId, userId),
      ),
    );

  return true;
};

// Full async pipeline: R2 fetch -> Chimege STT -> Gemini analysis -> D1 update.
// Throws on failure so the queue consumer can retry; persists a "failed" row
// before re-throwing so the frontend stops polling on the final attempt.
export const processStandaloneRecording = async ({
  env,
  recordingId,
  userId,
}: {
  env: Bindings;
  recordingId: string;
  userId: string;
}) => {
  const db = useDB({ env });

  const recording = await findRecordingForUser(db, recordingId, userId);

  if (!recording) {
    throw new Error(`Recording not found: ${recordingId}`);
  }

  if (recording.status === "done") {
    return;
  }

  try {
    const object = await env.R2_BUCKET.get(recording.audioUrl);

    if (!object) {
      throw new Error(`R2 object missing: ${recording.audioUrl}`);
    }

    const rawBuffer = await object.arrayBuffer();

    // Browser MediaRecorder produces WebM/Opus, which Chimege's STT rejects
    // (it only accepts compressed MP3/MP4/M4A — not WAV/PCM). We transcode it to
    // mono 48 kHz MP3 in-Worker before upload. Other formats (mp3, m4a from
    // direct file uploads) are forwarded as-is.
    const needsTranscode = isWebmContainer(new Uint8Array(rawBuffer));
    const audioBuffer = needsTranscode
      ? transcodeWebmToMp3(rawBuffer, opusModule)
      : rawBuffer;

    // Diarize the audio, cut it into per-speaker chunks, and run Chimege STT on
    // each chunk. This gives true acoustic speaker attribution + count, replacing
    // the old "flat Chimege transcript + Gemini guesses the speakers" approach.
    const diarized = await diarizedTranscribe(env, audioBuffer);

    // Gemini's only remaining job: summary bullets over the labelled transcript.
    const keyPoints = await generateKeyPoints(env, diarized.transcript);
    const durationSeconds =
      recording.durationSeconds ?? inferMp3DurationSeconds(audioBuffer);

    await db
      .update(standaloneRecordings)
      .set({
        transcript: diarized.transcript,
        speakerCount: diarized.speakerCount,
        keyPoints,
        scriptSegments: diarized.segments.map((s) => ({
          speakerLabel: s.speakerLabel,
          text: s.text,
        })),
        durationSeconds,
        status: "done",
        errorMessage: null,
      })
      .where(eq(standaloneRecordings.id, recordingId));

    console.info("[recordings] Recording processed", {
      ...getRuntimeLogContext(env),
      recordingId,
      speakerCount: diarized.speakerCount,
      segments: diarized.segments.length,
    });
  } catch (error) {
    await markRecordingFailed(db, recordingId, (error as Error).message);
    throw error;
  }
};
