"use client";

import { cn } from "@/lib/utils";
import { Radio } from "lucide-react";
import { useEffect, useState } from "react";
import {
  startMeetingEgress,
  stopMeetingEgress,
  type StartMeetingEgressResponse,
  type StopMeetingEgressResponse,
} from "../index";

type RecordingControlsProps = {
  meetingId: string;
  onStatusChange?: (status: RecordingStatus) => void;
  participantNames?: string[];
  roomName: string;
};

export type RecordingStatus = "active" | "not-started" | "ready";

export const RecordingControls = ({
  meetingId,
  onStatusChange,
  participantNames,
  roomName,
}: RecordingControlsProps) => {
  const [recording, setRecording] =
    useState<StartMeetingEgressResponse | StopMeetingEgressResponse | null>(
      null
    );
  const [hasStopped, setHasStopped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStartRecording = async () => {
    setError("");
    setIsLoading(true);

    try {
      setRecording(await startMeetingEgress({ meetingId, roomName }));
      setHasStopped(false);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopRecording = async () => {
    if (!recording?.egressId) return;

    setError("");
    setIsLoading(true);

    try {
      setRecording(
        await stopMeetingEgress({
          egressId: recording.egressId,
          participantNames,
        })
      );
      setHasStopped(true);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const isRecordingActive = Boolean(recording?.egressId) && !hasStopped;
  const recordingStatus: RecordingStatus = isRecordingActive
    ? "active"
    : hasStopped
      ? "ready"
      : "not-started";
  const statusConfig = isRecordingActive
    ? {
        className:
          "border-red-400/30 bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-100 shadow-[0_0_24px_rgba(239,68,68,0.16)]",
        dotClassName: "bg-red-400",
        label: "Recording in progress",
      }
    : hasStopped
      ? {
          className: "border-emerald-400/30 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-900 dark:text-emerald-100",
          dotClassName: "bg-emerald-400",
          label: "Recording ready",
        }
      : {
          className: "border-border bg-muted/50 text-muted-foreground",
          dotClassName: "bg-zinc-500",
          label: "Recording not started",
        };
  const controlLabel = isRecordingActive
    ? isLoading
      ? "Stopping..."
      : "Recording"
    : isLoading
      ? "Starting..."
      : hasStopped
        ? "Ready"
        : "Record";

  useEffect(() => {
    onStatusChange?.(recordingStatus);
  }, [onStatusChange, recordingStatus]);

  return (
    <>
      <button
        className={cn(
          "inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-60",
          isRecordingActive
            ? "bg-red-500/20 text-red-800 dark:text-red-100 hover:bg-red-500/30"
            : hasStopped
              ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-500/20"
              : "bg-muted text-foreground hover:bg-accent",
        )}
        disabled={isLoading || hasStopped}
        onClick={() =>
          void (isRecordingActive ? handleStopRecording() : handleStartRecording())
        }
        title={statusConfig.label}
        type="button"
      >
        <Radio className="size-4" />
        <span
          className={cn(
            "size-1.5 rounded-full",
            isRecordingActive && "animate-pulse",
            statusConfig.dotClassName,
          )}
        />
        <span className="hidden sm:inline">{controlLabel}</span>
      </button>

      {error ? (
        <p className="basis-full rounded-2xl border border-red-400/30 bg-red-100 dark:bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-200">
          {error}
        </p>
      ) : null}
    </>
  );
};
