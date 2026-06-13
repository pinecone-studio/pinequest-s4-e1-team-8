import { Context } from "hono";
import { desc, eq, inArray } from "drizzle-orm";
import { useDB } from "../../lib/db/db";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import { meetings, meetingSummaries } from "../../schema/meeting.model";
import { meetingTranscriptions } from "../../schema/meetingTranscription/meeting-transcription.schema";
import type { Bindings, Variables } from "../../lib/common/types";

const SUMMARY_PREVIEW_LENGTH = 160;

export const getMeetings = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  try {
    const userId = await getAuthenticatedUserId(c);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const db = useDB(c);

    const userMeetings = await db
      .select()
      .from(meetings)
      .where(eq(meetings.userId, userId))
      .orderBy(desc(meetings.createdAt))
      .all();

    if (userMeetings.length === 0) {
      return c.json({ meetings: [] }, 200);
    }

    const meetingIds = userMeetings.map((meeting) => meeting.id);

    const [transcriptions, summaries] = await Promise.all([
      db
        .select()
        .from(meetingTranscriptions)
        .where(inArray(meetingTranscriptions.meetingId, meetingIds))
        .orderBy(desc(meetingTranscriptions.createdAt))
        .all(),
      db
        .select()
        .from(meetingSummaries)
        .where(inArray(meetingSummaries.meetingId, meetingIds))
        .all(),
    ]);

    const latestTranscriptionByMeetingId = new Map<
      string,
      (typeof transcriptions)[number]
    >();
    for (const transcription of transcriptions) {
      if (!latestTranscriptionByMeetingId.has(transcription.meetingId)) {
        latestTranscriptionByMeetingId.set(transcription.meetingId, transcription);
      }
    }

    const summaryByMeetingId = new Map(
      summaries.map((summary) => [summary.meetingId, summary]),
    );

    const result = userMeetings.map((meeting) => {
      const transcription = latestTranscriptionByMeetingId.get(meeting.id) ?? null;
      const summary = summaryByMeetingId.get(meeting.id) ?? null;

      return {
        id: meeting.id,
        title: meeting.title,
        createdAt: meeting.createdAt,
        updatedAt: meeting.updatedAt,
        transcriptionStatus: transcription?.status ?? null,
        summaryPreview: summary
          ? summary.content.slice(0, SUMMARY_PREVIEW_LENGTH)
          : null,
      };
    });

    return c.json({ meetings: result }, 200);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};
