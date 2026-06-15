"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  CopyIcon,
  DownloadIcon,
  FileTextIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlayCircleIcon,
  RadioIcon,
  VideoIcon,
} from "lucide-react";
import Link from "next/link";

type MeetingDetailTopbarProps = {
  meetingId: string;
  title: string;
  createdDate: string | null;
  durationLabel: string | null;
  transcript: string | null;
  audioUrl: string | null;
  roomName: string | null;
};

export const MeetingDetailTopbar = ({
  meetingId,
  title,
  createdDate,
  durationLabel,
  transcript,
  audioUrl,
  roomName,
}: MeetingDetailTopbarProps) => {
  const toast = useToast();
  const isRecording = title === "Instant Meeting";

  const handleDownloadTranscript = () => {
    if (!transcript) return;

    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${title.trim().toLowerCase().replace(/\s+/g, "-")}-transcript.txt`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(`${window.location.origin}/meetings/${meetingId}`);

    toast.add({
      title: "Link copied",
      description: "The meeting link has been copied to your clipboard.",
      type: "success",
    });
  };

  return (
    <header className="relative z-10 flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-zinc-100 px-4 py-4 dark:border-white/5 lg:px-6">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" render={<Link href="/meetings" />}>
          <ArrowLeftIcon />
          Back to meetings
        </Button>
        <h1 className="font-heading text-xl font-semibold text-foreground lg:text-2xl">{title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {createdDate ? (
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="size-4" />
              {createdDate}
            </span>
          ) : null}
          {durationLabel ? (
            <span className="flex items-center gap-1.5">
              <ClockIcon className="size-4" />
              {durationLabel}
            </span>
          ) : null}
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
            {isRecording ? <RadioIcon className="size-3.5" /> : <VideoIcon className="size-3.5" />}
            {isRecording ? "Recording" : "Google Meet"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={handleDownloadTranscript}
          disabled={!transcript}
          aria-label="Download transcript"
        >
          <DownloadIcon />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          disabled
          title="Editing isn't available yet"
          aria-label="Edit meeting"
        >
          <PencilIcon />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label="More options"
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCopyLink}>
              <CopyIcon />
              Copy meeting link
            </DropdownMenuItem>
            {audioUrl ? (
              <DropdownMenuItem render={<a href={audioUrl} target="_blank" rel="noreferrer" />}>
                <PlayCircleIcon />
                Open recording
              </DropdownMenuItem>
            ) : null}
            {roomName ? (
              <DropdownMenuItem render={<Link href={`/meeting?meetingId=${meetingId}&roomName=${roomName}`} />}>
                <VideoIcon />
                Rejoin room
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/80"
          render={<a href="#" />}
        >
          <FileTextIcon />
          Open in Google Docs
        </Button>
      </div>
    </header>
  );
};
