import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import { finalizeRecordingUrl } from "./egress-finalization.service";
import {
  findByEgressId,
  markFailed,
} from "./meeting-transcription.service";
import { parseLiveKitEgressCompletePayload } from "./livekit-webhook-parser";
import type { Bindings } from "../../lib/common/types";

export const liveKitWebhook = async (c: Context<{ Bindings: Bindings }>) => {
  try {
    // TODO: Verify LiveKit webhook signatures before trusting payloads.
    const payload = await c.req.json();
    const { egressId, event, isFinal, recordingUrl } =
      parseLiveKitEgressCompletePayload(payload);

    if (!egressId) return c.json({ error: "egressId is required" }, 400);

    if (!isFinal) {
      return c.json({ egressId, ignored: true, status: "ignored" }, 200);
    }

    const db = useDB(c);
    const transcription = await findByEgressId(db, egressId);

    if (!transcription) {
      return c.json({ error: "Transcription not found" }, 404);
    }

    if (!recordingUrl) {
      console.warn("[meetingTranscription] Final egress webhook missing URL", {
        egressId,
        event,
      });

      await markFailed(
        db,
        transcription.id,
        "LiveKit egress completed without recording URL",
      );

      return c.json({ error: "recordingUrl is required" }, 400);
    }

    await finalizeRecordingUrl({
      db,
      env: c.env,
      egressId,
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
