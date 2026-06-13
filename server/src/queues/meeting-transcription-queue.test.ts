import { describe, expect, test, mock } from "bun:test";
import type { MessageBatch } from "@cloudflare/workers-types";
import type { Bindings, MeetingTranscriptionJob } from "../lib/common/types";

const finalizeRecordingUrl = mock(
  async () => ({ status: "done" as const, skipped: false }),
);

mock.module(
  "../controllers/meetingTranscription/egress-finalization.service",
  () => ({ finalizeRecordingUrl }),
);

mock.module("../lib/db/db", () => ({ useDB: () => ({}) }));

const { handleMeetingTranscriptionQueue } = await import(
  "./meeting-transcription-queue"
);

const TEST_ENV = {} as Bindings;

const createMessage = (
  body: MeetingTranscriptionJob,
  attempts: number,
) => ({
  id: "msg-1",
  timestamp: new Date(),
  body,
  attempts,
  ack: mock(() => {}),
  retry: mock(() => {}),
});

const createBatch = (
  messages: ReturnType<typeof createMessage>[],
): MessageBatch<MeetingTranscriptionJob> =>
  ({
    messages,
    queue: "meeting-transcription-jobs",
    retryAll: mock(() => {}),
    ackAll: mock(() => {}),
  }) as unknown as MessageBatch<MeetingTranscriptionJob>;

const JOB: MeetingTranscriptionJob = {
  egressId: "egress-1",
  recordingUrl: "https://example.com/recording.mp3",
  userId: "user-1",
};

describe("handleMeetingTranscriptionQueue", () => {
  test("acks the message when finalizeRecordingUrl succeeds", async () => {
    finalizeRecordingUrl.mockImplementationOnce(async () => ({
      status: "done" as const,
      skipped: false,
    }));

    const message = createMessage(JOB, 1);

    await handleMeetingTranscriptionQueue(createBatch([message]), TEST_ENV);

    expect(finalizeRecordingUrl).toHaveBeenCalledWith({
      db: {},
      env: TEST_ENV,
      egressId: JOB.egressId,
      recordingUrl: JOB.recordingUrl,
      userId: JOB.userId,
    });
    expect(message.ack).toHaveBeenCalledTimes(1);
    expect(message.retry).not.toHaveBeenCalled();
  });

  test("retries the message when finalizeRecordingUrl fails and attempts remain", async () => {
    finalizeRecordingUrl.mockImplementationOnce(async () => {
      throw new Error("Chimege client error: timed out");
    });

    const message = createMessage(JOB, 1);

    await handleMeetingTranscriptionQueue(createBatch([message]), TEST_ENV);

    expect(message.retry).toHaveBeenCalledTimes(1);
    expect(message.ack).not.toHaveBeenCalled();
  });

  test("acks (gives up) after the final attempt fails", async () => {
    finalizeRecordingUrl.mockImplementationOnce(async () => {
      throw new Error("Chimege client error: timed out");
    });

    const message = createMessage(JOB, 3);

    await handleMeetingTranscriptionQueue(createBatch([message]), TEST_ENV);

    expect(message.ack).toHaveBeenCalledTimes(1);
    expect(message.retry).not.toHaveBeenCalled();
  });
});
