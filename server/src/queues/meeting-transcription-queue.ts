import type { MessageBatch } from "@cloudflare/workers-types";
import { useDB } from "../lib/db/db";
import { finalizeRecordingUrl } from "../controllers/meetingTranscription/egress-finalization.service";
import type { Bindings, MeetingTranscriptionJob } from "../lib/common/types";

const MAX_ATTEMPTS = 3;

const getRuntimeLogContext = (env: Bindings) => ({
  database: env.D1_DATABASE_NAME ?? "unknown",
  environment: env.ENVIRONMENT ?? "unknown",
});

export const handleMeetingTranscriptionQueue = async (
  batch: MessageBatch<MeetingTranscriptionJob>,
  env: Bindings,
) => {
  const db = useDB({ env });

  for (const message of batch.messages) {
    const { egressId, recordingUrl, userId } = message.body;

    try {
      await finalizeRecordingUrl({ db, env, egressId, recordingUrl, userId });
      message.ack();
    } catch (error) {
      console.error("[meetingTranscription] Queue job failed", {
        ...getRuntimeLogContext(env),
        egressId,
        attempts: message.attempts,
        error: (error as Error).message,
      });

      if (message.attempts < MAX_ATTEMPTS) {
        message.retry();
      } else {
        message.ack();
      }
    }
  }
};
