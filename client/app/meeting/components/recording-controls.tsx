"use client";

import { useState } from "react";
import {
  startMeetingEgress,
  stopMeetingEgress,
  type StartMeetingEgressResponse,
  type StopMeetingEgressResponse,
} from "../index";
import { RecordingActionButton } from "./recording-action-button";
import { TranscriptPanel } from "./transcript-panel";

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
    <section className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Recording</h3>
          <p className="text-xs text-zinc-400">{status}</p>
        </div>
        <RecordingActionButton
          isLoading={isLoading}
          isRecordingActive={isRecordingActive}
          isStopped={hasStopped}
          onStart={() => void handleStartRecording()}
          onStop={() => void handleStopRecording()}
        />
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {recording ? (
        <dl className="grid gap-2 text-xs text-zinc-400">
          <div>
            <dt className="font-medium text-zinc-200">Egress ID</dt>
            <dd className="break-all">{recording.egressId}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-200">Transcription ID</dt>
            <dd className="break-all">{recording.transcriptionId}</dd>
          </div>
        </dl>
      ) : null}
      <TranscriptPanel transcriptionId={recording?.transcriptionId} />
    </section>
  );
};
