"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getMeetingTranscript,
  type GetMeetingTranscriptResponse,
} from "../index";

export const useMeetingTranscript = (transcriptionId?: string) => {
  const [transcript, setTranscript] =
    useState<GetMeetingTranscriptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshTranscript = useCallback(async () => {
    if (!transcriptionId) return;

    setError("");
    setIsLoading(true);

    try {
      setTranscript(await getMeetingTranscript({ id: transcriptionId }));
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [transcriptionId]);

  useEffect(() => {
    setTranscript(null);
    setError("");
    void refreshTranscript();
  }, [refreshTranscript]);

  useEffect(() => {
    if (!transcriptionId || transcript?.status !== "processing") return;

    const intervalId = window.setInterval(() => {
      void refreshTranscript();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [refreshTranscript, transcript?.status, transcriptionId]);

  return {
    error,
    isLoading,
    refreshTranscript,
    transcript,
  };
};
