"use client";

import { Button } from "@/components/ui/button";
import { MicIcon, RotateCcwIcon, SquareIcon } from "lucide-react";
import { VoiceWaveform } from "./voice-waveform";

type VoiceCaptureStepProps = {
  promptText: string;
  isRecording: boolean;
  isMonitoring: boolean;
  hasRecording: boolean;
  elapsedMs: number;
  waveformDataRef: { current: Uint8Array<ArrayBuffer> };
  isSubmitting: boolean;
  errorMessage: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onReRecord: () => void;
  onSave: () => void;
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function VoiceCaptureStep({
  promptText,
  isRecording,
  isMonitoring,
  hasRecording,
  elapsedMs,
  waveformDataRef,
  isSubmitting,
  errorMessage,
  onStartRecording,
  onStopRecording,
  onReRecord,
  onSave,
}: VoiceCaptureStepProps) {
  return (
    <div className="flex flex-col items-center gap-7 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Record your voice sample</h1>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          Read the passage below aloud, then save your recording to finish setup.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <p className="max-w-sm text-base leading-7 text-foreground">{promptText}</p>
      </div>

      <VoiceWaveform dataRef={waveformDataRef} active={isMonitoring} />

      <p className="text-3xl font-semibold tabular-nums text-foreground">
        {formatDuration(elapsedMs)}
      </p>

      {errorMessage ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {!hasRecording ? (
          <Button
            size="lg"
            className="h-11 min-w-[200px] text-base"
            onClick={isRecording ? onStopRecording : onStartRecording}
          >
            {isRecording ? (
              <>
                <SquareIcon className="size-4" />
                Stop recording
              </>
            ) : (
              <>
                <MicIcon className="size-4" />
                Start recording
              </>
            )}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="lg"
              className="h-11 min-w-[160px] text-base"
              onClick={onReRecord}
              disabled={isSubmitting}
            >
              <RotateCcwIcon className="size-4" />
              Re-record
            </Button>
            <Button
              size="lg"
              className="h-11 min-w-[160px] text-base"
              onClick={onSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving…" : "Save and continue"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
