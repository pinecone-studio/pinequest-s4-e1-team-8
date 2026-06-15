"use client";

import { Button } from "@/components/ui/button";
import {
  formatElapsed,
  useRecordingUploader,
} from "@/components/recordings/use-recording-uploader";
import { cn } from "@/lib/utils";
import { Loader2, Mic, Square, Upload, UploadCloud } from "lucide-react";
import { useState } from "react";

type RecordingDropzoneProps = {
  onUploaded: (recordingId: string) => void;
};

export function RecordingDropzone({ onUploaded }: RecordingDropzoneProps) {
  const {
    isRecording,
    elapsed,
    error,
    busy,
    startRecording,
    stopRecording,
    uploadFile,
  } = useRecordingUploader(onUploaded);

  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void uploadFile(file, file.name);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (busy || isRecording) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void uploadFile(file, file.name);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-start pt-6 lg:pt-10">
      <h2 className="max-w-md text-center font-heading text-xl font-semibold text-foreground">
        Upload an audio file to generate a transcription
      </h2>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy && !isRecording) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "mt-5 flex min-h-72 w-full max-w-2xl flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-card/40",
        )}
      >
        <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          {busy ? (
            <Loader2 className="size-7 animate-spin" />
          ) : isRecording ? (
            <span className="size-4 animate-pulse rounded-full bg-destructive" />
          ) : (
            <UploadCloud className="size-7" />
          )}
        </span>

        <p className="text-sm text-muted-foreground">
          {isRecording
            ? `Recording… ${formatElapsed(elapsed)}`
            : busy
              ? "Uploading your file…"
              : "Drag and drop MP3 or WAV files here or select a file to upload"}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {isRecording ? (
            <Button variant="destructive" onClick={stopRecording} disabled={busy}>
              <Square className="size-4" />
              Stop &amp; process
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                render={<label htmlFor="recording-dropzone-upload" />}
                disabled={busy}
              >
                <Upload className="size-4" />
                Upload
              </Button>
              <input
                id="recording-dropzone-upload"
                type="file"
                accept="audio/*,.m4a,.webm"
                className="hidden"
                onChange={handleFileChange}
                disabled={busy}
              />
              <Button onClick={() => void startRecording()} disabled={busy}>
                <Mic className="size-4" />
                Record
              </Button>
            </>
          )}
        </div>

        <p className="text-xs text-muted-foreground">Maximum size 20MB</p>
      </div>

      {error ? (
        <p className="mt-4 w-full max-w-2xl rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-center text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
