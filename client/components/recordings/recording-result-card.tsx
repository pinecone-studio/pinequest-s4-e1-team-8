"use client";

import { useRecordingStatus } from "@/app/recordings/hooks/use-recording-status";
import type { StandaloneRecording } from "@/app/recordings/types";
import { RecordingAudioPlayer } from "@/components/recordings/recording-audio-player";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AlertTriangle, Check, MoreHorizontal, Users } from "lucide-react";
import { useState } from "react";

type RecordingResultCardProps = {
  recording: StandaloneRecording;
};

const ProcessingSkeleton = () => (
  <div className="space-y-3">
    <div className="h-6 w-40 animate-pulse rounded-full bg-muted" />
    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
    <div className="space-y-2 pt-2">
      <div className="h-12 animate-pulse rounded-xl bg-muted" />
      <div className="h-12 w-5/6 animate-pulse rounded-xl bg-muted" />
    </div>
  </div>
);

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

// Assigns a stable color per distinct speaker label for the timeline.
const speakerToneClasses = [
  "bg-primary/10 text-primary",
  "bg-sage text-sage-foreground",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  "bg-pink-500/15 text-pink-600 dark:text-pink-400",
];

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

// "..." action — opens the full, unedited Chimege transcript (every word as
// returned by STT, before any Gemini diarization/summarization).
const RawTranscriptDialog = ({
  title,
  transcript,
}: {
  title: string;
  transcript: string | null;
}) => (
  <Dialog>
    <DialogTrigger
      type="button"
      aria-label="Show full transcript"
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <MoreHorizontal className="size-4.5" />
    </DialogTrigger>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="truncate pr-8">{title}</DialogTitle>
        <DialogDescription>
          Бүрэн бичлэг (Chimege-ийн таниулсан үг бүр)
        </DialogDescription>
      </DialogHeader>
      <div className="max-h-[60vh] overflow-y-auto rounded-xl bg-muted/50 p-4">
        {transcript && transcript.trim().length > 0 ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {transcript}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Бичлэг хараахан бэлэн болоогүй байна.
          </p>
        )}
      </div>
    </DialogContent>
  </Dialog>
);

export function RecordingResultCard({
  recording: initialRecording,
}: RecordingResultCardProps) {
  const { recording, isProcessing, error } = useRecordingStatus(
    initialRecording.id,
    initialRecording,
  );

  const current = recording ?? initialRecording;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-heading text-base font-semibold text-foreground">
            {current.title}
          </h3>
          <p className="text-xs text-muted-foreground capitalize">
            {current.status}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {current.status === "done" &&
          typeof current.speakerCount === "number" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Users className="size-3.5" />
              Нийт ярилцсан хүн: {current.speakerCount}
            </span>
          ) : null}

          <RawTranscriptDialog
            title={current.title}
            transcript={current.transcript}
          />
        </div>
      </header>

      <RecordingAudioPlayer recordingId={current.id} />

      {current.status === "failed" ? (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            {current.errorMessage ?? "Processing failed. Please try again."}
          </span>
        </div>
      ) : isProcessing ? (
        <ProcessingSkeleton />
      ) : (
        <div className="space-y-5">
          {current.keyPoints && current.keyPoints.length > 0 ? (
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Гол санаанууд
              </h4>
              <KeyPointsChecklist keyPoints={current.keyPoints} />
            </section>
          ) : null}

          {current.scriptSegments && current.scriptSegments.length > 0 ? (
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Яриа
              </h4>
              <ScriptTimeline segments={current.scriptSegments} />
            </section>
          ) : null}
        </div>
      )}

      {error ? (
        <p className="text-xs text-muted-foreground">
          Couldn’t refresh status: {error}
        </p>
      ) : null}
    </article>
  );
}
