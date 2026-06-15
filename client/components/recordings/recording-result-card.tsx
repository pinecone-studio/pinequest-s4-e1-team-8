"use client";

import {
  deleteRecording,
  downloadRecording,
} from "@/app/recordings/api/recordings-api";
import { useRecordingStatus } from "@/app/recordings/hooks/use-recording-status";
import type { StandaloneRecording } from "@/app/recordings/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMeetingDateLong } from "@/lib/meetings/format-meeting-date";
import { TRANSCRIPTION_STATUS_STYLES } from "@/lib/meetings/transcription-status";
import {
  formatRecordingDuration,
  formatRecordingFileSize,
} from "@/lib/recordings/format-recording";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  ClockIcon,
  DownloadIcon,
  FolderIcon,
  HardDriveIcon,
  MoreVerticalIcon,
  RadioIcon,
  SparklesIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type RecordingResultCardProps = {
  recording: StandaloneRecording;
  onDeleted?: () => void;
};

const getRecordingPreview = (recording: StandaloneRecording) => {
  if (recording.status === "failed" && recording.errorMessage) {
    return recording.errorMessage;
  }

  if (recording.keyPoints?.[0]) return recording.keyPoints[0];

  if (recording.transcript?.trim()) {
    return recording.transcript.trim();
  }

  if (recording.status === "processing" || recording.status === "pending") {
    return "Processing your recording…";
  }

  return null;
};

export function RecordingResultCard({
  recording: initialRecording,
  onDeleted,
}: RecordingResultCardProps) {
  const { recording } = useRecordingStatus(
    initialRecording.id,
    initialRecording,
  );
  const [actionError, setActionError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const current = recording ?? initialRecording;
  const status = TRANSCRIPTION_STATUS_STYLES[current.status];
  const preview = getRecordingPreview(current);
  const hasSummary = Boolean(current.keyPoints && current.keyPoints.length > 0);
  const durationLabel = formatRecordingDuration(current.durationSeconds);
  const fileSizeLabel = formatRecordingFileSize(current.fileSizeBytes);

  const handleDownload = async () => {
    setActionError("");
    setIsDownloading(true);

    try {
      await downloadRecording(current.id, current.title);
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
      await deleteRecording(current.id);
      onDeleted?.();
    } catch (caughtError) {
      setActionError((caughtError as Error).message);
      setIsDeleting(false);
    }
  };

  return (
    <Card className="ring-1 ring-foreground/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/recordings/${current.id}`}
            className="min-w-0 hover:underline"
          >
            <h3 className="truncate font-heading text-base font-semibold text-foreground">
              {current.title}
            </h3>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="outline" className="gap-1 bg-muted text-muted-foreground">
              <FolderIcon className="size-3" />
              Voice recordings
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label="More options"
                disabled={isDeleting || isDownloading}
              >
                <MoreVerticalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href={`/recordings/${current.id}`} />}>
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleDownload()}>
                  <DownloadIcon />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => void handleDelete()}
                >
                  <Trash2Icon />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="size-3.5" />
            {formatMeetingDateLong(
              current.createdAt != null ? String(current.createdAt) : null,
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

        {preview ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {preview}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {hasSummary ? (
              <Badge className="gap-1 bg-sage text-sage-foreground">
                <SparklesIcon className="size-3" />
                AI summary
              </Badge>
            ) : null}
            <Badge className="gap-1 bg-tag-yellow text-tag-yellow-foreground">
              <UsersIcon className="size-3" />
              Speakers: {current.speakerCount ?? 0}
            </Badge>
          </div>
        </div>

        {actionError ? (
          <p className="text-xs text-destructive">{actionError}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
