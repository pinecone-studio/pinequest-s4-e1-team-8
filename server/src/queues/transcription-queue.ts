import type { MessageBatch } from "@cloudflare/workers-types";
import { useDB } from "../lib/db/db";
import { finalizeRecordingUrl } from "../controllers/meetingTranscription/egress-finalization.service";
import { processStandaloneRecording } from "../controllers/recordings/recordings.service";
import type {
  Bindings,
  MeetingTranscriptionJob,
  StandaloneRecordingJob,
  TranscriptionQueueJob,
} from "../lib/common/types";

const MAX_ATTEMPTS = 3;

const getRuntimeLogContext = (env: Bindings) => ({
  database: env.D1_DATABASE_NAME ?? "unknown",
  environment: env.ENVIRONMENT ?? "unknown",
});

const isStandaloneJob = (
  body: TranscriptionQueueJob,
): body is StandaloneRecordingJob =>
  (body as StandaloneRecordingJob).type === "standalone";

// Single Worker `queue` handler for every transcription job. Standalone Voice
// Recordings jobs carry `type: "standalone"`; meeting egress jobs do not and
// fall through to the LiveKit finalize path.
export const handleTranscriptionQueue = async (
  batch: MessageBatch<TranscriptionQueueJob>,
  env: Bindings,
) => {
  for (const message of batch.messages) {
    const body = message.body;

    try {
      if (isStandaloneJob(body)) {
        await processStandaloneRecording({
          env,
          recordingId: body.recordingId,
          userId: body.userId,
        });
      } else {
        const { egressId, recordingUrl, userId } =
          body as MeetingTranscriptionJob;
        const db = useDB({ env });
        await finalizeRecordingUrl({ db, env, egressId, recordingUrl, userId });
      }

      message.ack();
    } catch (error) {
      console.error("[transcriptionQueue] Queue job failed", {
        ...getRuntimeLogContext(env),
        body,
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
