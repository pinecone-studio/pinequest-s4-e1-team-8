import { and, desc, eq } from "drizzle-orm";
import { standaloneRecordings } from "../../schema/recordings.schema";
import { transcribeAudio } from "../meetingTranscription/chimege-client";
import {
  generateStandaloneAnalysis,
  getAcousticSpeakerCount,
} from "../../lib/gemini/meeting-analysis";
import { parseStandaloneAnalysis } from "../../lib/gemini/parse-standalone-analysis";
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
}: {
  db: RecordingsDb;
  id: string;
  userId: string;
  title: string;
  audioUrl: string;
}) => {
  await db.insert(standaloneRecordings).values({
    id,
    userId,
    title,
    audioUrl,
    status: "processing",
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
    const rawMimeType = object.httpMetadata?.contentType ?? "audio/mpeg";

    // Browser MediaRecorder produces WebM/Opus, which Chimege's STT rejects
    // (it only accepts compressed MP3/MP4/M4A — not WAV/PCM). We transcode it to
    // mono 48 kHz MP3 in-Worker before upload. Other formats (mp3, m4a from
    // direct file uploads) are forwarded as-is.
    const needsTranscode = isWebmContainer(new Uint8Array(rawBuffer));
    const audioBuffer = needsTranscode
      ? transcodeWebmToMp3(rawBuffer, opusModule)
      : rawBuffer;
    const mimeType = needsTranscode ? "audio/mpeg" : rawMimeType;
    const extension = "mp3";

    const transcript = await transcribeAudio(audioBuffer, env.CHIMEGE_API_KEY, {
      baseUrl: env.CHIMEGE_BASE_URL,
      filename: `${recordingId}.${extension}`,
      mimeType,
    });

    // Acoustic diarization on the raw audio is far more reliable than counting
    // speakers from the flat transcript, so run it first and feed the result
    // into the text analysis as a hard constraint — that keeps the "Илтгэгч N"
    // segment labels in sync with the headline count instead of inventing ghost
    // speakers. Falls back to the text-based estimate when the audio call fails.
    const acousticSpeakerCount = await getAcousticSpeakerCount(
      env,
      audioBuffer,
      mimeType,
    );

    const analysisRaw = await generateStandaloneAnalysis(
      env,
      transcript,
      acousticSpeakerCount,
    );
    const analysis = parseStandaloneAnalysis(analysisRaw);

    if (!analysis) {
      await db
        .update(standaloneRecordings)
        .set({
          transcript,
          status: "failed",
          errorMessage: "Gemini analysis returned no usable result",
        })
        .where(eq(standaloneRecordings.id, recordingId));

      console.warn("[recordings] Analysis parse failed", {
        ...getRuntimeLogContext(env),
        recordingId,
      });

      return;
    }

    await db
      .update(standaloneRecordings)
      .set({
        transcript,
        speakerCount: acousticSpeakerCount ?? analysis.speakerCount,
        keyPoints: analysis.keyPoints,
        scriptSegments: analysis.segments,
        status: "done",
        errorMessage: null,
      })
      .where(eq(standaloneRecordings.id, recordingId));

    console.info("[recordings] Recording processed", {
      ...getRuntimeLogContext(env),
      recordingId,
      speakerCount: acousticSpeakerCount ?? analysis.speakerCount,
      acousticSpeakerCount,
      textSpeakerCount: analysis.speakerCount,
    });
  } catch (error) {
    await markRecordingFailed(db, recordingId, (error as Error).message);
    throw error;
  }
};
