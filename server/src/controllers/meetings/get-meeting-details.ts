import { Context } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { useDB } from "../../lib/db/db";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import {
  meetings,
  meetingSummaries,
  meetingTranscriptSegments,
} from "../../schema/meeting.model";
import { meetingTranscriptions } from "../../schema/meetingTranscription/meeting-transcription.schema";
import type { Bindings, Variables } from "../../lib/common/types";

export const getMeetingDetails = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  try {
    const userId = await getAuthenticatedUserId(c);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const meetingId = c.req.param("id");

    if (!meetingId) return c.json({ error: "id is required" }, 400);

    const db = useDB(c);

    const meeting = await db
      .select()
      .from(meetings)
      .where(and(eq(meetings.id, meetingId), eq(meetings.userId, userId)))
      .get();

    if (!meeting) {
      return c.json({ error: "Meeting not found" }, 404);
    }

    const [transcription, summary, transcriptSegments] = await Promise.all([
      db
        .select()
        .from(meetingTranscriptions)
        .where(eq(meetingTranscriptions.meetingId, meetingId))
        .orderBy(desc(meetingTranscriptions.createdAt))
        .get(),
      db
        .select()
        .from(meetingSummaries)
        .where(eq(meetingSummaries.meetingId, meetingId))
        .get(),
      db
        .select()
        .from(meetingTranscriptSegments)
        .where(eq(meetingTranscriptSegments.meetingId, meetingId))
        .orderBy(meetingTranscriptSegments.timestamp)
        .all(),
    ]);

    return c.json(
      {
        meeting,
        transcription: transcription ?? null,
        summary: summary ?? null,
        transcriptSegments,
      },
      200,
    );
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};
