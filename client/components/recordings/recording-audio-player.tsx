"use client";

import { fetchRecordingAudioObjectUrl } from "@/app/recordings/api/recordings-api";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type RecordingAudioPlayerProps = {
  recordingId: string;
};

// Plays back the user's own uploaded recording. Useful for A/B testing mic
// settings (e.g. noise suppression on vs. off) by listening to the raw capture.
export function RecordingAudioPlayer({
  recordingId,
}: RecordingAudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let objectUrl: string | null = null;
    let isActive = true;

    setIsLoading(true);
    setError(null);

    fetchRecordingAudioObjectUrl(recordingId)
      .then((url) => {
        objectUrl = url;
        if (isActive) {
          setAudioUrl(url);
        } else {
          URL.revokeObjectURL(url);
        }
      })
      .catch((caughtError: unknown) => {
        if (isActive) {
          setError((caughtError as Error).message);
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [recordingId]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Аудио ачааллаж байна…
      </div>
    );
  }

  if (error || !audioUrl) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <AlertTriangle className="size-3.5 shrink-0" />
        {error ?? "Аудио бэлэн биш байна."}
      </div>
    );
  }

  return (
    <audio controls src={audioUrl} className="h-9 w-full">
      <track kind="captions" />
    </audio>
  );
}
