import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import {
  createTranscription,
  markFailed,
  saveEgressId,
} from "./meeting-transcription.service";
import { startRoomEgress } from "./livekit-egress.service";
import type { Bindings } from "../../lib/common/types";

const getRuntimeLogContext = (env: Bindings) => ({
  database: env.D1_DATABASE_NAME ?? "unknown",
  environment: env.ENVIRONMENT ?? "unknown",
});

export const startEgress = async (c: Context<{ Bindings: Bindings }>) => {
  const db = useDB(c);
  let transcriptionId: string | null = null;

  try {
    const { meetingId, roomName, filepath } = await c.req.json();

    if (!meetingId) return c.json({ error: "meetingId is required" }, 400);
    if (!roomName) return c.json({ error: "roomName is required" }, 400);

    console.info("[meetingTranscription] Starting egress", {
      ...getRuntimeLogContext(c.env),
      meetingId,
      roomName,
    });

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

    console.info("[meetingTranscription] Egress started", {
      ...getRuntimeLogContext(c.env),
      egressId: egress.egressId,
      meetingId,
      roomName,
      transcriptionId,
    });

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

    console.error("[meetingTranscription] Failed to start egress", {
      ...getRuntimeLogContext(c.env),
      error: errorMessage,
      transcriptionId,
    });

    return c.json({ error: errorMessage }, 500);
  }
};
