import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import {
  findByEgressId,
  markFailed,
  transcribeRecording,
} from "./meeting-transcription.service";
import { parseLiveKitEgressCompletePayload } from "./livekit-webhook-parser";
import type { Bindings } from "../../lib/common/types";

export const liveKitWebhook = async (c: Context<{ Bindings: Bindings }>) => {
  try {
    // TODO: Verify LiveKit webhook signatures before trusting payloads.
    const payload = await c.req.json();
    const { egressId, recordingUrl } =
      parseLiveKitEgressCompletePayload(payload);

    if (!egressId) return c.json({ error: "egressId is required" }, 400);

    const db = useDB(c);
    const transcription = await findByEgressId(db, egressId);

    if (!transcription) {
      return c.json({ error: "Transcription not found" }, 404);
    }

    if (!recordingUrl) {
      await markFailed(
        db,
        transcription.id,
        "LiveKit egress completed without recording URL",
      );

      return c.json({ error: "recordingUrl is required" }, 400);
    }

    await transcribeRecording({
      db,
      env: c.env,
      transcriptionId: transcription.id,
      recordingUrl,
    });

    return c.json(
      {
        transcriptionId: transcription.id,
        egressId,
        status: "done",
      },
      200,
    );
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};
