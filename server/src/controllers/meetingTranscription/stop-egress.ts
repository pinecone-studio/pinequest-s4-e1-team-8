import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import {
  findByEgressId,
  markEgressStopped,
} from "./meeting-transcription.service";
import { stopRoomEgress } from "./livekit-egress.service";
import type { Bindings } from "../../lib/common/types";

export const stopEgress = async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const { egressId } = await c.req.json();

    if (typeof egressId !== "string" || !egressId.trim()) {
      return c.json({ error: "egressId is required" }, 400);
    }

    const db = useDB(c);
    const transcription = await findByEgressId(db, egressId);

    if (!transcription) {
      return c.json({ error: "Transcription not found" }, 404);
    }

    await stopRoomEgress({
      env: c.env,
      egressId,
    });

    await markEgressStopped(db, transcription.id);

    return c.json(
      {
        transcriptionId: transcription.id,
        egressId,
        status: "processing",
      },
      200,
    );
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};
