"use client";

import { useEffect, useRef, useState } from "react";
import {
  startMeetingEgress,
  stopMeetingEgress,
  type StartMeetingEgressResponse,
} from "../index";

type RecordingControlsProps = {
  autoStart?: boolean;
  meetingId: string;
  onStatusChange?: (status: RecordingStatus) => void;
  participantNames?: string[];
  roomName: string;
};

export type RecordingStatus = "active" | "not-started" | "ready";

export const RecordingControls = ({
  autoStart,
  meetingId,
  onStatusChange,
  participantNames,
  roomName,
}: RecordingControlsProps) => {
  const [recording, setRecording] =
    useState<StartMeetingEgressResponse | null>(null);
  const [hasStopped, setHasStopped] = useState(false);
  const [error, setError] = useState("");
  const recordingRef = useRef(recording);
  const hasStoppedRef = useRef(hasStopped);
  const participantNamesRef = useRef(participantNames);

  recordingRef.current = recording;
  hasStoppedRef.current = hasStopped;
  participantNamesRef.current = participantNames;

  const recordingStatus: RecordingStatus =
    recording?.egressId && !hasStopped
      ? "active"
      : hasStopped
        ? "ready"
        : "not-started";

  useEffect(() => {
    onStatusChange?.(recordingStatus);
  }, [onStatusChange, recordingStatus]);

  useEffect(() => {
    if (!autoStart) return;

    let isActive = true;

    const start = async () => {
      try {
        const response = await startMeetingEgress({ meetingId, roomName });
        if (isActive) setRecording(response);
      } catch (caughtError) {
        if (isActive) setError((caughtError as Error).message);
      }
    };

    void start();

    return () => {
      isActive = false;

      const activeRecording = recordingRef.current;
      if (!activeRecording?.egressId || hasStoppedRef.current) return;

      setHasStopped(true);
      void stopMeetingEgress({
        egressId: activeRecording.egressId,
        participantNames: participantNamesRef.current,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return error ? (
    <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      {error}
    </p>
  ) : null;
};
