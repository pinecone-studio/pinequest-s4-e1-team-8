import { Context } from "hono";
import { WebhookReceiver } from "livekit-server-sdk";
import { useDB } from "../../lib/db/db";
import {
  findByEgressId,
  markFailed,
} from "./meeting-transcription.service";
import { parseLiveKitEgressCompletePayload } from "./livekit-webhook-parser";
import type { Bindings } from "../../lib/common/types";

const getRuntimeLogContext = (env: Bindings) => ({
  database: env.D1_DATABASE_NAME ?? "unknown",
  environment: env.ENVIRONMENT ?? "unknown",
});

const verifyWebhookSignature = async (
  c: Context<{ Bindings: Bindings }>,
  rawBody: string,
) => {
  const receiver = new WebhookReceiver(
    c.env.LIVEKIT_API_KEY,
    c.env.LIVEKIT_API_SECRET,
  );

  await receiver.receive(rawBody, c.req.header("Authorization"));
};

export const liveKitWebhook = async (c: Context<{ Bindings: Bindings }>) => {
  const rawBody = await c.req.text();

  try {
    await verifyWebhookSignature(c, rawBody);
  } catch (error) {
    console.warn(
      "[meetingTranscription] Rejected unverified LiveKit webhook",
      {
        ...getRuntimeLogContext(c.env),
        error: (error as Error).message,
      },
    );

    return c.json({ error: "Invalid webhook signature" }, 401);
  }

  try {
    const payload = JSON.parse(rawBody);
    const { egressId, event, isFinal, recordingUrl, userId } =
      parseLiveKitEgressCompletePayload(payload);

    if (!egressId) return c.json({ error: "egressId is required" }, 400);

    console.info("[meetingTranscription] LiveKit webhook received", {
      ...getRuntimeLogContext(c.env),
      egressId,
      event,
      isFinal,
      recordingUrl,
    });

    if (!isFinal) {
      return c.json({ egressId, ignored: true, status: "ignored" }, 200);
    }

    const db = useDB(c);
    const transcription = await findByEgressId(db, egressId);

    if (!transcription) {
      console.warn("[meetingTranscription] Webhook has no transcription row", {
        ...getRuntimeLogContext(c.env),
        egressId,
        event,
        recordingUrl,
      });

      return c.json({ error: "Transcription not found" }, 404);
    }

    if (!recordingUrl) {
      console.warn("[meetingTranscription] Final egress webhook missing URL", {
        ...getRuntimeLogContext(c.env),
        egressId,
        event,
        roomName: transcription.roomName,
        transcriptionId: transcription.id,
      });

      await markFailed(
        db,
        transcription.id,
        "LiveKit egress completed without recording URL",
      );

      return c.json({ error: "recordingUrl is required" }, 400);
    }

    await c.env.MEETING_TRANSCRIPTION_QUEUE.send({
      egressId,
      recordingUrl,
      userId,
    });

    console.info("[meetingTranscription] Queued recording for transcription", {
      ...getRuntimeLogContext(c.env),
      egressId,
      roomName: transcription.roomName,
      transcriptionId: transcription.id,
    });

    return c.json(
      {
        transcriptionId: transcription.id,
        egressId,
        status: "queued",
      },
      200,
    );
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};
