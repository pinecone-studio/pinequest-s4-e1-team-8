import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import {
  createTranscription,
  markFailed,
  transcribeRecording,
} from "./meeting-transcription.service";
import type { Bindings } from "../../lib/common/types";

export const postMeetingSummary = async (
  c: Context<{ Bindings: Bindings }>,
) => {
  let transcriptionId: string | null = null;

  try {
    const db = useDB(c);
    const { roomName, meetingId, recordingUrl, egressId, summary } =
      await c.req.json();

    if (!roomName) return c.json({ error: "roomName is required" }, 400);
    if (!meetingId) return c.json({ error: "meetingId is required" }, 400);
    if (!recordingUrl)
      return c.json({ error: "recordingUrl is required" }, 400);

    const savedEgressId = typeof egressId === "string" ? egressId : null;
    const savedSummary = typeof summary === "string" ? summary : null;

    transcriptionId = await createTranscription({
      db,
      meetingId,
      roomName,
      recordingUrl,
      egressId: savedEgressId,
      summary: savedSummary,
    });

    const { transcript, summary: generatedSummary } =
      await transcribeRecording({
        db,
        env: c.env,
        transcriptionId,
        meetingId,
        recordingUrl,
        summary: savedSummary,
      });

    return c.json(
      {
        id: transcriptionId,
        transcript,
        summary: savedSummary ?? generatedSummary,
      },
      201,
    );
  } catch (error) {
    const errorMessage = (error as Error).message;

    if (transcriptionId) {
      await markFailed(useDB(c), transcriptionId, errorMessage);
    }

    return c.json({ error: errorMessage }, 500);
  }
};
