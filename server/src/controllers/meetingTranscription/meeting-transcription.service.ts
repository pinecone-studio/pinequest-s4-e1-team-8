import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { meetingTranscriptions } from "../../schema/meetingTranscription/meeting-transcription.schema";
import { transcribeAudio } from "./chimege-client";
import { downloadRecordingFromR2 } from "./r2-recording-download.service";
import type { Bindings } from "../../lib/common/types";
import type { MeetingTranscriptionDb } from "../../lib/meetingTypes/meeting-transcription.types";

export const createTranscription = async ({
  db,
  meetingId,
  roomName,
  recordingUrl,
  egressId,
  summary,
}: {
  db: MeetingTranscriptionDb;
  meetingId: string;
  roomName: string;
  recordingUrl?: string;
  egressId?: string | null;
  summary?: string | null;
}) => {
  const id = nanoid();

  await db.insert(meetingTranscriptions).values({
    id,
    meetingId,
    roomName,
    audioUrl: recordingUrl,
    egressId,
    summary,
    status: "processing",
  });

  return id;
};

export const saveEgressId = async (
  db: MeetingTranscriptionDb,
  transcriptionId: string,
  egressId: string,
) => {
  await db
    .update(meetingTranscriptions)
    .set({ egressId, status: "processing", errorMessage: null })
    .where(eq(meetingTranscriptions.id, transcriptionId));
};

export const findByEgressId = async (
  db: MeetingTranscriptionDb,
  egressId: string,
) => {
  return db
    .select()
    .from(meetingTranscriptions)
    .where(eq(meetingTranscriptions.egressId, egressId))
    .get();
};

export const markEgressStopped = async (
  db: MeetingTranscriptionDb,
  transcriptionId: string,
) => {
  await db
    .update(meetingTranscriptions)
    .set({ status: "processing", errorMessage: null })
    .where(eq(meetingTranscriptions.id, transcriptionId));
};

export const markFailed = async (
  db: MeetingTranscriptionDb,
  transcriptionId: string,
  errorMessage: string,
) => {
  await db
    .update(meetingTranscriptions)
    .set({ status: "failed", errorMessage })
    .where(eq(meetingTranscriptions.id, transcriptionId));
};

export const transcribeRecording = async ({
  db,
  env,
  transcriptionId,
  recordingUrl,
  summary,
}: {
  db: MeetingTranscriptionDb;
  env: Bindings;
  transcriptionId: string;
  recordingUrl: string;
  summary?: string | null;
}) => {
  try {
    await db
      .update(meetingTranscriptions)
      .set({ audioUrl: recordingUrl, status: "processing", errorMessage: null })
      .where(eq(meetingTranscriptions.id, transcriptionId));

    // TODO: Move audio download and Chimege polling into a Queue/Workflow for production Workers.
    const recording = await downloadRecordingFromR2({ env, recordingUrl });

    const transcript = await transcribeAudio(
      recording.buffer,
      env.CHIMEGE_API_KEY,
      {
        baseUrl: env.CHIMEGE_BASE_URL,
        filename: recording.filename,
        fileSize: recording.size,
        mimeType: recording.contentType,
      },
    );

    await db
      .update(meetingTranscriptions)
      .set({
        transcript,
        summary,
        status: "done",
        errorMessage: null,
        completedAt: new Date(),
      })
      .where(eq(meetingTranscriptions.id, transcriptionId));

    return { transcript, summary };
  } catch (error) {
    await markFailed(db, transcriptionId, (error as Error).message);
    throw error;
  }
};
