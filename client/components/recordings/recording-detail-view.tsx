"use client";

import {
  deleteRecording,
  downloadRecording,
} from "@/app/recordings/api/recordings-api";
import { useRecordingStatus } from "@/app/recordings/hooks/use-recording-status";
import { RecordingDetailContent } from "@/components/recordings/recording-detail-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMeetingDateLong } from "@/lib/meetings/format-meeting-date";
import { TRANSCRIPTION_STATUS_STYLES } from "@/lib/meetings/transcription-status";
import {
  formatRecordingDuration,
  formatRecordingFileSize,
} from "@/lib/recordings/format-recording";
import { cn } from "@/lib/utils";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  DownloadIcon,
  FolderIcon,
  HardDriveIcon,
  RadioIcon,
  SparklesIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type RecordingDetailViewProps = {
  recordingId: string;
};

const RecordingDetailSkeleton = () => (
  <div className="flex min-h-0 flex-1 flex-col gap-6 p-4 lg:p-6">
    <div className="h-9 w-40 animate-pulse rounded-full bg-muted" />
    <div className="h-40 animate-pulse rounded-2xl bg-muted" />
    <div className="h-96 animate-pulse rounded-2xl bg-muted" />
  </div>
);

export function RecordingDetailView({ recordingId }: RecordingDetailViewProps) {
  const router = useRouter();
  const { recording, isProcessing, error } = useRecordingStatus(recordingId);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionError, setActionError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setNotFound(false);
  }, [recordingId]);

  useEffect(() => {
    if (recording) {
      setIsLoading(false);
      setNotFound(false);
      return;
    }

    if (error) {
      setIsLoading(false);
      setNotFound(true);
    }
  }, [recording, error]);

  if (isLoading) return <RecordingDetailSkeleton />;

  if (notFound || !recording) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-medium text-foreground">Recording not found</p>
        <p className="text-sm text-muted-foreground">
          This recording doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Button variant="outline" size="sm" render={<Link href="/recordings" />}>
          <ArrowLeftIcon />
          Back to recordings
        </Button>
      </div>
    );
  }

  const status = TRANSCRIPTION_STATUS_STYLES[recording.status];
  const durationLabel = formatRecordingDuration(recording.durationSeconds);
  const fileSizeLabel = formatRecordingFileSize(recording.fileSizeBytes);
  const hasSummary = Boolean(recording.keyPoints && recording.keyPoints.length > 0);

  const handleDownload = async () => {
    setActionError("");
    setIsDownloading(true);

    try {
      await downloadRecording(recording.id, recording.title);
    } catch (caughtError) {
      setActionError((caughtError as Error).message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this recording? This cannot be undone.")) return;

    setActionError("");
    setIsDeleting(true);

    try {
      await deleteRecording(recording.id);
      router.push("/recordings");
      router.refresh();
    } catch (caughtError) {
      setActionError((caughtError as Error).message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" render={<Link href="/recordings" />}>
          <ArrowLeftIcon />
          Back to recordings
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleDownload()}
            disabled={isDownloading || isDeleting}
          >
            <DownloadIcon />
            Download
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => void handleDelete()}
            disabled={isDeleting || isDownloading}
          >
            <Trash2Icon />
            Delete
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 font-heading text-2xl font-semibold text-foreground">
              {recording.title}
            </h1>

            <Badge variant="outline" className="gap-1 bg-muted text-muted-foreground">
              <FolderIcon className="size-3" />
              Voice recordings
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="size-3.5" />
              {formatMeetingDateLong(
                recording.createdAt != null ? String(recording.createdAt) : null,
              )}
            </span>
            {durationLabel ? (
              <span className="flex items-center gap-1.5">
                <ClockIcon className="size-3.5" />
                {durationLabel}
              </span>
            ) : null}
            {fileSizeLabel ? (
              <span className="flex items-center gap-1.5">
                <HardDriveIcon className="size-3.5" />
                {fileSizeLabel}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <RadioIcon className="size-3.5" />
              Recording
            </span>
            <Badge className={cn("gap-1", status.className)}>{status.label}</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {hasSummary ? (
              <Badge className="gap-1 bg-sage text-sage-foreground">
                <SparklesIcon className="size-3" />
                AI summary
              </Badge>
            ) : null}
            <Badge className="gap-1 bg-tag-yellow text-tag-yellow-foreground">
              <UsersIcon className="size-3" />
              Speakers: {recording.speakerCount ?? 0}
            </Badge>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <RecordingDetailContent recording={recording} isProcessing={isProcessing} />
      </div>

      {actionError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      {error && recording ? (
        <p className="text-xs text-muted-foreground">
          Couldn&apos;t refresh status: {error}
        </p>
      ) : null}
    </div>
  );
}
