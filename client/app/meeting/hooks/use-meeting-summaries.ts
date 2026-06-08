"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteMeetingTranscript,
  getMeetingTranscripts,
  type GetMeetingTranscriptResponse,
} from "../index";

export const useMeetingSummaries = () => {
  const [transcripts, setTranscripts] = useState<GetMeetingTranscriptResponse[]>(
    [],
  );
  const [deletingId, setDeletingId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshSummaries = useCallback(
    async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
      setError("");
      if (showLoading) setIsLoading(true);

      try {
        const response = await getMeetingTranscripts();

        setTranscripts(response.transcripts);
      } catch (caughtError) {
        setTranscripts([]);
        setError((caughtError as Error).message);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [],
  );

  const deleteSummary = useCallback(async (id: string) => {
    setError("");
    setDeletingId(id);

    try {
      await deleteMeetingTranscript(id);
      setTranscripts((current) =>
        current.filter((transcript) => transcript.id !== id),
      );
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setDeletingId("");
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      await refreshSummaries();

      if (!isActive) return;
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [refreshSummaries]);

  return {
    deleteSummary,
    deletingId,
    error,
    isLoading,
    refreshSummaries,
    transcripts,
  };
};
