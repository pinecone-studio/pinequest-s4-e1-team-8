import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { meetingTranscriptions } from "../../schema/meetingTranscription/meeting-transcription.schema";
import {
  meetings,
  meetingSummaries,
  meetingTranscriptSegments,
} from "../../schema/meeting.model";
import { transcribeAudio } from "./chimege-client";
import {
  generateGroqSummary,
  generateGroqTranscriptSegments,
} from "../../lib/groq/groq-client";
import { parseMeetingSummary } from "../../lib/groq/parse-meeting-summary";
import { parseMeetingTranscriptSegments } from "../../lib/groq/parse-meeting-transcript-segments";
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

    let transcriptSegments: ReturnType<typeof parseMeetingTranscriptSegments> = null;
    try {
      const segmentsRaw = await generateGroqTranscriptSegments(
        env,
        transcript,
        participantNames,
      );
      transcriptSegments = parseMeetingTranscriptSegments(segmentsRaw);
    } catch (error) {
      console.warn(
        "[meetingTranscription] Failed to generate transcript segments",
        { meetingId, transcriptionId, error: (error as Error).message },
      );
    }

    const finalSummary =
      summary ?? (await generateGroqSummary(env, transcript, participantNames));

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
          // mainTopics doubles as the free-text overview, since Groq doesn't
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
