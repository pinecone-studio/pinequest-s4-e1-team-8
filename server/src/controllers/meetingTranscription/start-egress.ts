import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import {
  createTranscription,
  markFailed,
  saveEgressId,
} from "./meeting-transcription.service";
import { startRoomEgress } from "./livekit-egress.service";
import type { Bindings } from "../../lib/common/types";

export const startEgress = async (c: Context<{ Bindings: Bindings }>) => {
  const db = useDB(c);
  let transcriptionId: string | null = null;

  try {
    const { meetingId, roomName, filepath } = await c.req.json();

    if (!meetingId) return c.json({ error: "meetingId is required" }, 400);
    if (!roomName) return c.json({ error: "roomName is required" }, 400);

    transcriptionId = await createTranscription({
      db,
      meetingId,
      roomName,
    });

    const egress = await startRoomEgress({
      env: c.env,
      roomName,
      meetingId,
      transcriptionId,
      filepath: typeof filepath === "string" ? filepath : undefined,
    });

    await saveEgressId(db, transcriptionId, egress.egressId);

    return c.json(
      {
        transcriptionId,
        egressId: egress.egressId,
        status: "processing",
      },
      201,
    );
  } catch (error) {
    const errorMessage = (error as Error).message;

    if (transcriptionId) {
      await markFailed(db, transcriptionId, errorMessage);
    }

    return c.json({ error: errorMessage }, 500);
  }
};
