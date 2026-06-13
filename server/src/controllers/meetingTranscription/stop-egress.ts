import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import {
  findByEgressId,
  markFailed,
  markEgressStopped,
} from "./meeting-transcription.service";
import {
  finalizeEgressRecording,
  getEgressStatusName,
  isCompleteEgress,
  isFailedEgress,
} from "./egress-finalization.service";
import { pollEgressUntilFinal } from "./egress-polling.service";
import { stopRoomEgress } from "./livekit-egress.service";
import type { Bindings, Variables } from "../../lib/common/types";

const getEgressErrorMessage = (egressStatus: string, error?: string) => {
  return error
    ? `LiveKit egress failed with ${egressStatus}: ${error}`
    : `LiveKit egress failed with ${egressStatus}`;
};

export const stopEgress = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  try {
    const { egressId, participantNames } = await c.req.json();
    const userId = await getAuthenticatedUserId(c);

    if (typeof egressId !== "string" || !egressId.trim()) {
      return c.json({ error: "egressId is required" }, 400);
    }

    const savedParticipantNames = Array.isArray(participantNames)
      ? participantNames.filter((name): name is string => typeof name === "string")
      : null;

    const db = useDB(c);
    const transcription = await findByEgressId(db, egressId);

    if (!transcription) {
      return c.json({ error: "Transcription not found" }, 404);
    }

    const egress = await stopRoomEgress({
      env: c.env,
      egressId,
    });

    await markEgressStopped(db, transcription.id, savedParticipantNames);

    const finalEgress = isCompleteEgress(egress)
      ? egress
      : await pollEgressUntilFinal({
          env: c.env,
          egressId,
          initialEgress: egress,
        });

    if (finalEgress && isCompleteEgress(finalEgress)) {
      await finalizeEgressRecording({
        db,
        env: c.env,
        egress: finalEgress,
        userId,
      });

      return c.json(
        {
          transcriptionId: transcription.id,
          egressId,
          status: "queued",
        },
        200,
      );
    }

    if (finalEgress && isFailedEgress(finalEgress)) {
      const egressStatus = getEgressStatusName(finalEgress.status);
      const errorMessage = getEgressErrorMessage(
        egressStatus,
        finalEgress.error,
      );

      await markFailed(db, transcription.id, errorMessage);

      return c.json(
        {
          transcriptionId: transcription.id,
          egressId,
          status: "failed",
          errorMessage,
        },
        200,
      );
    }

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
