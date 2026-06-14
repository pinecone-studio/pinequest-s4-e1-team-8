"use client";

import { useCallback, useEffect, useState } from "react";
import { getRecording } from "../api/recordings-api";
import type {
  StandaloneRecording,
  StandaloneRecordingStatus,
} from "../types";

const POLL_INTERVAL_MS = 4000;

const TERMINAL_STATUSES: StandaloneRecordingStatus[] = ["done", "failed"];

export const useRecordingStatus = (
  recordingId?: string | null,
  initialRecording?: StandaloneRecording | null,
) => {
  const [recording, setRecording] = useState<StandaloneRecording | null>(
    initialRecording ?? null,
  );
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!recordingId) return;

    try {
      setRecording(await getRecording(recordingId));
      setError("");
    } catch (caughtError) {
      setError((caughtError as Error).message);
    }
  }, [recordingId]);

  useEffect(() => {
    if (!recordingId) return;

    // Only fetch immediately if we don't already hold a terminal snapshot.
    if (!initialRecording || !TERMINAL_STATUSES.includes(initialRecording.status)) {
      void refresh();
    }
  }, [recordingId, initialRecording, refresh]);

  useEffect(() => {
    if (!recordingId) return;
    if (recording && TERMINAL_STATUSES.includes(recording.status)) return;

    const intervalId = window.setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [recordingId, recording, refresh]);

  return {
    recording,
    error,
    refresh,
    status: recording?.status ?? null,
    isProcessing:
      !recording || !TERMINAL_STATUSES.includes(recording.status),
  };
};
