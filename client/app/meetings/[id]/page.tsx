import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMeetingDateLong, meetingJoinHref } from "@/lib/meetings/format";
import { getMeetingByIdSync } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { MeetingStatus } from "@/types";
import { ArrowLeftIcon, FileTextIcon, LanguagesIcon, VideoIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const statusStyles: Record<MeetingStatus, { label: string; className: string }> = {
  ongoing: { label: "Live", className: "bg-primary/10 text-primary" },
  upcoming: { label: "Upcoming", className: "bg-lavender text-lavender-foreground" },
  ended: { label: "Ended", className: "bg-muted text-muted-foreground" },
  canceled: { label: "Canceled", className: "bg-destructive/10 text-destructive" },
};

type MeetingDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { id } = await params;
  const meeting = getMeetingByIdSync(id);

  if (!meeting) {
    notFound();
  }

  const status = statusStyles[meeting.status];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
      <Button variant="ghost" size="sm" className="w-fit" render={<Link href="/meetings" />}>
        <ArrowLeftIcon />
        Back to meetings
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl font-semibold text-foreground">{meeting.title}</h1>
                <Badge className={cn(status.className)}>{status.label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatMeetingDateLong(meeting.date)} · {meeting.startTime} – {meeting.endTime}
              </p>

              {meeting.description ? (
                <p className="text-sm leading-6 text-foreground">{meeting.description}</p>
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

              {meeting.status === "ongoing" || meeting.status === "upcoming" ? (
                <Button className="w-fit" render={<Link href={meetingJoinHref(meeting)} />}>
                  <VideoIcon />
                  {meeting.status === "ongoing" ? "Join meeting" : "Join early"}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {meeting.status === "ended" ? "This meeting has ended." : "This meeting was canceled."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <h2 className="font-heading text-base font-semibold text-foreground">
                Participants ({meeting.participants.length})
              </h2>
              <ul className="flex flex-col gap-3">
                {meeting.participants.map((participant) => (
                  <li key={participant.id} className="flex items-center gap-3">
                    <Avatar size="sm">
                      <AvatarFallback>{participant.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{participant.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{participant.role}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
