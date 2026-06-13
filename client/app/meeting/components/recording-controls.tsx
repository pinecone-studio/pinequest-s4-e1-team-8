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
  autoStart?: boolean;
  meetingId: string;
  onStatusChange?: (status: RecordingStatus) => void;
  participantNames?: string[];
  roomName: string;
};

export type RecordingStatus = "active" | "not-started" | "ready";

export const RecordingControls = ({
  autoStart,
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
          "border-destructive/30 bg-destructive/10 text-destructive shadow-[0_0_24px_rgba(224,71,58,0.16)]",
        dotClassName: "bg-destructive",
        label: "Recording in progress",
      }
    : hasStopped
      ? {
          className: "border-sage bg-sage text-sage-foreground",
          dotClassName: "bg-sage-foreground",
          label: "Recording ready",
        }
      : {
          className: "border-border bg-muted/50 text-muted-foreground",
          dotClassName: "bg-muted-foreground",
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

  useEffect(() => {
    if (autoStart) void handleStartRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <button
        className={cn(
          "inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
          isRecordingActive
            ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
            : hasStopped
              ? "bg-sage text-sage-foreground hover:bg-sage/70"
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
        <p className="basis-full rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </>
  );
};
