"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  Loader2Icon,
  MicIcon,
  VideoIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchMeetings, type MeetingListItem } from "@/app/meeting";
import { TRANSCRIPTION_STATUS_STYLES } from "@/lib/meetings/transcription-status";
import { cn } from "@/lib/utils";

const formatMeetingDate = (value: string | null) => {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export default function DashboardPage() {
  const { user } = useUser();
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    fetchMeetings()
      .then((response) => {
        if (isActive) setMeetings(response.meetings);
      })
      .catch(() => {})
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const readyMeetings = meetings.filter((meeting) => meeting.transcriptionStatus === "done");
  const inProgressMeetings = meetings.filter(
    (meeting) => meeting.transcriptionStatus === "pending" || meeting.transcriptionStatus === "processing",
  );
  const failedMeetings = meetings.filter((meeting) => meeting.transcriptionStatus === "failed");

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const stats = [
    {
      label: "Total meetings",
      value: meetings.length,
      icon: CalendarDaysIcon,
      accent: "bg-lavender text-lavender-foreground",
    },
    {
      label: "Recordings ready",
      value: readyMeetings.length,
      icon: MicIcon,
      accent: "bg-sage text-sage-foreground",
    },
    {
      label: "In progress",
      value: inProgressMeetings.length,
      icon: Loader2Icon,
      accent: "bg-primary/10 text-primary",
    },
    {
      label: "Failed",
      value: failedMeetings.length,
      icon: AlertCircleIcon,
      accent: "bg-destructive/10 text-destructive",
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {todayLabel} · Here&apos;s what&apos;s happening across your meetings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href="/meetings" />}>
            <CalendarDaysIcon />
            View meetings
          </Button>
          <Button render={<Link href="/meeting" />}>
            <VideoIcon />
            Start meeting
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3">
              <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", stat.accent)}>
                <stat.icon className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-base font-semibold text-foreground">Recent meetings</h2>
                <Button variant="ghost" size="sm" render={<Link href="/meetings" />}>
                  View all
                  <ArrowRightIcon />
                </Button>
              </div>

              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {[0, 1, 2].map((key) => (
                    <div key={key} className="h-14 animate-pulse rounded-xl bg-muted" />
                  ))}
                </div>
              ) : meetings.length > 0 ? (
                <div className="flex flex-col divide-y divide-border">
                  {meetings.slice(0, 5).map((meeting) => {
                    const status = TRANSCRIPTION_STATUS_STYLES[meeting.transcriptionStatus ?? "none"];

                    return (
                      <Link
                        key={meeting.id}
                        href={`/meetings/${meeting.id}`}
                        className="-mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-3 hover:bg-muted/60"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{meeting.title}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {formatMeetingDate(meeting.createdAt)}
                          </p>
                        </div>
                        <Badge className={cn(status.className)}>{status.label}</Badge>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No meetings yet. Start one to see it here.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-base font-semibold text-foreground">Recent recordings</h2>
                <Button variant="ghost" size="sm" render={<Link href="/meetings" />}>
                  View all
                  <ArrowRightIcon />
                </Button>
              </div>
              {readyMeetings.length > 0 ? (
                <ul className="flex flex-col divide-y divide-border">
                  {readyMeetings.slice(0, 3).map((meeting) => (
                    <li key={meeting.id} className="first:pt-0 last:pb-0">
                      <Link
                        href={`/meetings/${meeting.id}`}
                        className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-muted/60"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-lavender text-lavender-foreground">
                          <MicIcon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{meeting.title}</p>
                          {meeting.summaryPreview ? (
                            <p className="truncate text-xs text-muted-foreground">{meeting.summaryPreview}</p>
                          ) : null}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No recordings ready yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
