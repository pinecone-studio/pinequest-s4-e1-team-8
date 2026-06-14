"use client";

import { listRecordings } from "@/app/recordings/api/recordings-api";
import type { StandaloneRecording } from "@/app/recordings/types";
import { RecordingResultCard } from "@/components/recordings/recording-result-card";
import { VoiceRecorderCard } from "@/components/recordings/voice-recorder-card";
import { FolderOpenIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<StandaloneRecording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecordings = useCallback(async () => {
    try {
      const response = await listRecordings();
      setRecordings(response.recordings);
      setError("");
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecordings();
  }, [loadRecordings]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Voice Recordings
        </h1>
        <p className="text-sm text-muted-foreground">
          Record or upload audio and get an AI transcript, key points, and a
          speaker-by-speaker script.
        </p>
      </div>

      <VoiceRecorderCard onUploaded={() => void loadRecordings()} />

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((key) => (
            <div key={key} className="h-48 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : recordings.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {recordings.map((recording) => (
            <RecordingResultCard key={recording.id} recording={recording} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <FolderOpenIcon className="size-8 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">No recordings yet</p>
            <p className="text-sm text-muted-foreground">
              Record from your microphone or upload a file to get started.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
