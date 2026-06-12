import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ParticipantAvatars } from "@/components/meetings/participant-avatars";
import { formatMeetingDate, meetingJoinHref } from "@/lib/meetings/format";
import { cn } from "@/lib/utils";
import type { Meeting, MeetingStatus } from "@/types";
import { FileTextIcon, LanguagesIcon, VideoIcon } from "lucide-react";
import Link from "next/link";

const statusStyles: Record<MeetingStatus, { label: string; className: string }> = {
  ongoing: { label: "Live", className: "bg-primary/10 text-primary" },
  upcoming: { label: "Upcoming", className: "bg-lavender text-lavender-foreground" },
  ended: { label: "Ended", className: "bg-muted text-muted-foreground" },
  canceled: { label: "Canceled", className: "bg-destructive/10 text-destructive" },
};

export function MeetingCard({ meeting }: { meeting: Meeting }) {
  const status = statusStyles[meeting.status];

  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-semibold text-foreground">{meeting.title}</h3>
              <Badge className={cn(status.className)}>{status.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatMeetingDate(meeting.date)} · {meeting.startTime} – {meeting.endTime}
            </p>
          </div>
        </div>

        {meeting.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{meeting.description}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {meeting.autoTranslate ? (
            <Badge variant="outline" className="gap-1">
              <LanguagesIcon className="size-3" />
              Auto-translate
            </Badge>
          ) : null}
          {meeting.recordAndSummarize ? (
            <Badge variant="outline" className="gap-1">
              <FileTextIcon className="size-3" />
              Record &amp; summarize
            </Badge>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <ParticipantAvatars participants={meeting.participants} />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" render={<Link href={`/meetings/${meeting.id}`} />}>
              Details
            </Button>
            {meeting.status === "ongoing" || meeting.status === "upcoming" ? (
              <Button size="sm" render={<Link href={meetingJoinHref(meeting)} />}>
                <VideoIcon />
                Join
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
