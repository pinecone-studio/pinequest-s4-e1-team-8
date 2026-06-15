"use client";

import type { StandaloneRecording } from "@/app/recordings/types";
import { RecordingAudioPlayer } from "@/components/recordings/recording-audio-player";
import { cn } from "@/lib/utils";
import { AlertTriangle, Check } from "lucide-react";
import { useState } from "react";

const speakerToneClasses = [
  "bg-primary/10 text-primary",
  "bg-sage text-sage-foreground",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  "bg-pink-500/15 text-pink-600 dark:text-pink-400",
];

const KeyPointsChecklist = ({ keyPoints }: { keyPoints: string[] }) => {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  if (keyPoints.length === 0) return null;

  return (
    <ul className="space-y-1.5">
      {keyPoints.map((point, index) => {
        const isChecked = Boolean(checked[index]);
        return (
          <li key={index}>
            <button
              type="button"
              onClick={() =>
                setChecked((prev) => ({ ...prev, [index]: !prev[index] }))
              }
              className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted"
            >
              <span
                className={cn(
                  "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-md border transition-colors",
                  isChecked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border",
                )}
              >
                {isChecked ? <Check className="size-3" /> : null}
              </span>
              <span
                className={cn(
                  "text-sm text-foreground",
                  isChecked && "text-muted-foreground line-through",
                )}
              >
                {point}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

const ScriptTimeline = ({
  segments,
}: {
  segments: StandaloneRecording["scriptSegments"];
}) => {
  if (!segments || segments.length === 0) return null;

  const labelOrder = [...new Set(segments.map((s) => s.speakerLabel))];

  return (
    <div className="space-y-3">
      {segments.map((segment, index) => {
        const toneIndex = labelOrder.indexOf(segment.speakerLabel);
        const tone =
          speakerToneClasses[
            (toneIndex < 0 ? index : toneIndex) % speakerToneClasses.length
          ];

        return (
          <div key={index} className="flex gap-3">
            <span
              className={cn(
                "h-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                tone,
              )}
            >
              {segment.speakerLabel}
            </span>
            <p className="flex-1 rounded-2xl rounded-tl-sm bg-muted/50 px-3.5 py-2 text-sm text-foreground">
              {segment.text}
            </p>
          </div>
        );
      })}
    </div>
  );
};

type RecordingDetailContentProps = {
  recording: StandaloneRecording;
  isProcessing?: boolean;
};

export function RecordingDetailContent({
  recording,
  isProcessing = false,
}: RecordingDetailContentProps) {
  return (
    <div className="space-y-5">
      <RecordingAudioPlayer recordingId={recording.id} />

      {recording.status === "failed" ? (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            {recording.errorMessage ?? "Processing failed. Please try again."}
          </span>
        </div>
      ) : isProcessing ? (
        <div className="space-y-3">
          <div className="h-6 w-40 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : (
        <>
          {recording.transcript?.trim() ? (
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Full transcript
              </h4>
              <div className="max-h-64 overflow-y-auto rounded-xl bg-muted/50 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {recording.transcript}
                </p>
              </div>
            </section>
          ) : null}

          {recording.keyPoints && recording.keyPoints.length > 0 ? (
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Гол санаанууд
              </h4>
              <KeyPointsChecklist keyPoints={recording.keyPoints} />
            </section>
          ) : null}

          {recording.scriptSegments && recording.scriptSegments.length > 0 ? (
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Яриа
              </h4>
              <ScriptTimeline segments={recording.scriptSegments} />
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
