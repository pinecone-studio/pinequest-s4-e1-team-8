"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  formatElapsed,
  useRecordingUploader,
} from "@/components/recordings/use-recording-uploader";
import { cn } from "@/lib/utils";
import { Loader2, Mic, Square, Upload } from "lucide-react";

type VoiceRecorderCardProps = {
  onUploaded: (recordingId: string) => void;
};

export function VoiceRecorderCard({ onUploaded }: VoiceRecorderCardProps) {
  const {
    isRecording,
    elapsed,
    error,
    noiseCleanup,
    setNoiseCleanup,
    busy,
    startRecording,
    stopRecording,
    uploadFile,
  } = useRecordingUploader(onUploaded);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void uploadFile(file, file.name);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-2xl",
              isRecording
                ? "bg-destructive/15 text-destructive"
                : "bg-primary/10 text-primary",
            )}
          >
            {isRecording ? (
              <span className="size-3 animate-pulse rounded-full bg-destructive" />
            ) : (
              <Mic className="size-5" />
            )}
          </span>
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">
              New voice recording
            </h2>
            <p className="text-sm text-muted-foreground">
              {isRecording
                ? `Recording… ${formatElapsed(elapsed)}`
                : busy
                  ? "Uploading…"
                  : "Record from your mic or upload an audio file."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRecording ? (
            <Button
              size="lg"
              variant="destructive"
              onClick={stopRecording}
              disabled={busy}
            >
              <Square className="size-4" />
              Stop & process
            </Button>
          ) : (
            <Button size="lg" onClick={() => void startRecording()} disabled={busy}>
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mic className="size-4" />
              )}
              Record
            </Button>
          )}

          <Button
            size="lg"
            variant="outline"
            render={<label htmlFor="recording-upload" />}
            disabled={busy || isRecording}
          >
            <Upload className="size-4" />
            Upload
          </Button>
          <input
            id="recording-upload"
            type="file"
            accept="audio/*,video/*,.m4a,.webm"
            className="hidden"
            onChange={handleFileChange}
            disabled={busy || isRecording}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2.5">
        <div className="min-w-0">
          <Label htmlFor="noise-cleanup" className="text-foreground">
            Noise cancellation
          </Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {noiseCleanup
              ? "Browser removes background noise, echo & auto-gains the mic."
              : "Off — captures the raw mic so you can hear the difference."}
          </p>
        </div>
        <Switch
          id="noise-cleanup"
          checked={noiseCleanup}
          onCheckedChange={setNoiseCleanup}
          disabled={isRecording || busy}
        />
      </div>

      {error ? (
        <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
