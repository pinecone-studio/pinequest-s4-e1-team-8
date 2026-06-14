import type { MeetingListItem } from "@/app/meeting";
import { AvatarStack } from "@/components/avatar-stack";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { users } from "@/lib/mock-data";
import { formatMeetingDate } from "@/lib/meetings/format-meeting-date";
import { TRANSCRIPTION_STATUS_STYLES } from "@/lib/meetings/transcription-status";
import { cn } from "@/lib/utils";
import { FolderIcon, MoreVerticalIcon, RadioIcon, VideoIcon } from "lucide-react";
import Link from "next/link";

type ActivityCardProps = {
  meeting: MeetingListItem;
};

export function ActivityCard({ meeting }: ActivityCardProps) {
  const status = TRANSCRIPTION_STATUS_STYLES[meeting.transcriptionStatus ?? "none"];
  const isRecording = meeting.title === "Instant Meeting";
  const SourceIcon = isRecording ? RadioIcon : VideoIcon;
  const sourceLabel = isRecording ? "Recording" : "Video meeting";

  const participants = users.slice(0, 1 + (meeting.id.charCodeAt(0) % 3));

  return (
    <Card className="ring-1 ring-foreground/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/meetings/${meeting.id}`} className="hover:underline">
              <h3 className="truncate font-heading text-base font-semibold text-foreground">
                {meeting.title}
              </h3>
            </Link>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <SourceIcon className="size-3.5" />
              <span>{formatMeetingDate(meeting.createdAt)}</span>
              <span aria-hidden="true">·</span>
              <span>{sourceLabel}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <FolderIcon className="size-3" />
              Meetings
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label="More options"
              >
                <MoreVerticalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href={`/meetings/${meeting.id}`} />}>
                  View details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {meeting.summaryPreview ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {meeting.summaryPreview}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={cn(status.className)}>{status.label}</Badge>
            {meeting.summaryPreview ? (
              <Badge className="bg-lavender text-lavender-foreground">AI summary</Badge>
            ) : null}
          </div>

          <AvatarStack users={participants} size="sm" max={3} />
        </div>
      </CardContent>
    </Card>
  );
}
