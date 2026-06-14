"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { uploadRecording } from "@/app/recordings/api/recordings-api";
import { cn } from "@/lib/utils";
import { Loader2, Mic, Square, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type VoiceRecorderCardProps = {
  onUploaded: (recordingId: string) => void;
};

const pickMimeType = () => {
  if (typeof MediaRecorder === "undefined") return "";

  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
};

const formatElapsed = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

export function VoiceRecorderCard({ onUploaded }: VoiceRecorderCardProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  // Off = raw mic capture; on = browser noise/echo/gain cleanup. Lets you A/B
  // the same voice with and without background noise cancellation.
  const [noiseCleanup, setNoiseCleanup] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopTimer();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleUpload = async (blob: Blob, filename: string, title?: string) => {
    setIsUploading(true);
    setError("");

    try {
      const { recordingId } = await uploadRecording(blob, filename, title);
      onUploaded(recordingId);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: noiseCleanup,
          echoCancellation: noiseCleanup,
          autoGainControl: noiseCleanup,
        },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stopTimer();
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const extension = type.includes("ogg") ? "ogg" : "webm";
        const cleanupLabel = noiseCleanup ? "NC on" : "NC off";
        const title = `Recording (${cleanupLabel}) - ${new Date().toLocaleTimeString(
          "en-CA",
        )}`;
        void handleUpload(blob, `recording-${Date.now()}.${extension}`, title);
      };

      recorder.start();
      setIsRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(
        () => setElapsed((value) => value + 1),
        1000,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof DOMException
          ? "Microphone access was denied. Allow it in your browser to record."
          : (caughtError as Error).message,
      );
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void handleUpload(file, file.name);
  };

  const busy = isUploading;

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
            accept="audio/*,.m4a,.webm"
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
