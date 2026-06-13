"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getMeetingTranscript,
  type GetMeetingTranscriptResponse,
  type MeetingTranscriptionStatus,
} from "../index";

const POLL_INTERVAL_MS = 4000;

const TERMINAL_STATUSES: MeetingTranscriptionStatus[] = ["done", "failed"];

export const useTranscriptionStatus = (transcriptionId?: string | null) => {
  const [transcription, setTranscription] =
    useState<GetMeetingTranscriptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!transcriptionId) return;

    try {
      setTranscription(await getMeetingTranscript({ id: transcriptionId }));
      setError("");
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [transcriptionId]);

  useEffect(() => {
    setTranscription(null);
    setError("");

    if (!transcriptionId) return;

    setIsLoading(true);
    void refresh();
  }, [transcriptionId, refresh]);

  useEffect(() => {
    if (!transcriptionId) return;
    if (transcription && TERMINAL_STATUSES.includes(transcription.status)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [refresh, transcription, transcriptionId]);

  return {
    error,
    isLoading,
    refresh,
    status: transcription?.status ?? null,
    transcription,
  };
};
