import { Context } from "hono";
import { eq } from "drizzle-orm";
import { useDB } from "../../lib/db/db";
import { meetingTranscriptions } from "../../schema/meetingTranscription/meeting-transcription.schema";
import type { Bindings } from "../../lib/common/types";

export const deleteMeetingTranscript = async (
  c: Context<{ Bindings: Bindings }>,
) => {
  try {
    const db = useDB(c);
    const id = c.req.param("id");

    if (!id) return c.json({ error: "id is required" }, 400);

    await db.delete(meetingTranscriptions).where(eq(meetingTranscriptions.id, id));

    return c.json({ message: "Meeting summary deleted" }, 200);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};
