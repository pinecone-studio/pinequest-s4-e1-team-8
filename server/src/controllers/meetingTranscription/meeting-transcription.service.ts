import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { meetingTranscriptions } from "../../schema/meetingTranscription/meeting-transcription.schema";
import {
  meetings,
  meetingSummaries,
  meetingTranscriptSegments,
} from "../../schema/meeting.model";
import { generateMeetingSummary } from "../../lib/gemini/meeting-analysis";
import { diarizedTranscribe } from "../../lib/diarization/diarized-transcribe";
import { parseMeetingSummary } from "../../lib/gemini/parse-meeting-summary";
import { downloadRecordingFromR2 } from "./r2-recording-download.service";
import { runD1Statements } from "../../lib/db/d1-batch";
import type { Bindings } from "../../lib/common/types";
import type { MeetingTranscriptionDb } from "../../lib/meetingTypes/meeting-transcription.types";

type BatchStatement = Parameters<MeetingTranscriptionDb["batch"]>[0][number];

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
  participantNames?: string[] | null,
) => {
  await db
    .update(meetingTranscriptions)
    .set({
      status: "processing",
      errorMessage: null,
      ...(participantNames ? { participantNames } : {}),
    })
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
  meetingId,
  recordingUrl,
  summary,
  participantNames,
  userId,
}: {
  db: MeetingTranscriptionDb;
  env: Bindings;
  transcriptionId: string;
  meetingId: string;
  recordingUrl: string;
  summary?: string | null;
  participantNames?: string[] | null;
  userId?: string | null;
}) => {
  try {
    await db
      .update(meetingTranscriptions)
      .set({ audioUrl: recordingUrl, status: "processing", errorMessage: null })
      .where(eq(meetingTranscriptions.id, transcriptionId));

    if (userId) {
      await db
        .insert(meetings)
        .values({
          id: meetingId,
          userId,
          title: `Meeting - ${new Date().toLocaleDateString()}`,
        })
        .onConflictDoNothing();
    }

    const recording = await downloadRecordingFromR2({ env, recordingUrl });

    // Diarize → cut per speaker → Chimege STT per chunk. Speaker attribution and
    // count now come from acoustic diarization instead of Gemini guessing them
    // from a flat transcript (see audio.md §6.2). Segments carry real start times
    // from the diarizer rather than LLM-estimated offsets.
    const diarized = await diarizedTranscribe(env, recording.buffer);
    const transcript = diarized.transcript;

    const transcriptSegments = diarized.segments.length
      ? diarized.segments.map((segment) => ({
          speakerName: segment.speakerLabel,
          text: segment.text,
          timestampSeconds: segment.startSec,
        }))
      : null;

    const finalSummary =
      summary ?? (await generateMeetingSummary(env, transcript, participantNames));

    const statements: BatchStatement[] = [
      db
        .update(meetingTranscriptions)
        .set({
          transcript,
          summary: finalSummary,
          status: "done",
          errorMessage: null,
          completedAt: new Date(),
        })
        .where(eq(meetingTranscriptions.id, transcriptionId)),
    ];

    const structuredSummary = parseMeetingSummary(finalSummary);

    if (structuredSummary || transcriptSegments) {
      const meeting = await db
        .select({ id: meetings.id })
        .from(meetings)
        .where(eq(meetings.id, meetingId))
        .get();

      if (meeting) {
        const now = new Date();

        if (structuredSummary) {
          // mainTopics doubles as the free-text overview, since Gemini doesn't
          // return a separate summary paragraph.
          const content = structuredSummary.mainTopics.join("\n");

          statements.push(
            db
              .insert(meetingSummaries)
              .values({
                id: nanoid(),
                meetingId,
                content,
                keyPoints: structuredSummary.keyDecisions,
                actionItems: structuredSummary.actionItems,
                createdAt: now,
                updatedAt: now,
              })
              .onConflictDoUpdate({
                target: meetingSummaries.meetingId,
                set: {
                  content,
                  keyPoints: structuredSummary.keyDecisions,
                  actionItems: structuredSummary.actionItems,
                  updatedAt: now,
                },
              }),
          );
        }

        if (transcriptSegments) {
          statements.push(
            db.insert(meetingTranscriptSegments).values(
              transcriptSegments.map((segment) => ({
                id: nanoid(),
                meetingId,
                speakerName: segment.speakerName,
                text: segment.text,
                timestamp: new Date(now.getTime() + segment.timestampSeconds * 1000),
              })),
            ),
          );
        }
      } else {
        console.warn(
          "[meetingTranscription] No meetings row for meetingId; skipping meetingSummaries/meetingTranscriptSegments write",
          { meetingId, transcriptionId },
        );
      }
    }

    await runD1Statements(db, statements);

    return { transcript, summary: finalSummary };
  } catch (error) {
    await markFailed(db, transcriptionId, (error as Error).message);
    throw error;
  }
};
