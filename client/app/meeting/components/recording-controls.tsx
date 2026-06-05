"use client";

import { useState } from "react";
import {
  startMeetingEgress,
  stopMeetingEgress,
  type StartMeetingEgressResponse,
  type StopMeetingEgressResponse,
} from "../index";
import { RecordingActionButton } from "./recording-action-button";

type RecordingControlsProps = {
  meetingId: string;
  roomName: string;
};

export const RecordingControls = ({
  meetingId,
  roomName,
}: RecordingControlsProps) => {
  const [recording, setRecording] =
    useState<StartMeetingEgressResponse | StopMeetingEgressResponse | null>(
      null
    );
  const [hasStopped, setHasStopped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStartRecording = async () => {
    setError("");
    setIsLoading(true);

    try {
      setRecording(await startMeetingEgress({ meetingId, roomName }));
      setHasStopped(false);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopRecording = async () => {
    if (!recording?.egressId) return;

    setError("");
    setIsLoading(true);

    try {
      setRecording(await stopMeetingEgress({ egressId: recording.egressId }));
      setHasStopped(true);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const isRecordingActive = Boolean(recording?.egressId) && !hasStopped;
  const status = hasStopped ? "stopped" : recording?.status ?? "not started";

  return (
    <section className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-950">Recording</h3>
          <p className="text-xs text-zinc-500">{status}</p>
        </div>
        <RecordingActionButton
          isLoading={isLoading}
          isRecordingActive={isRecordingActive}
          isStopped={hasStopped}
          onStart={() => void handleStartRecording()}
          onStop={() => void handleStopRecording()}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {recording ? (
        <dl className="grid gap-2 text-xs text-zinc-600 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-zinc-900">Egress ID</dt>
            <dd className="break-all">{recording.egressId}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">Transcription ID</dt>
            <dd className="break-all">{recording.transcriptionId}</dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
};
