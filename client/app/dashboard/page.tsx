import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardActionItems } from "@/components/dashboard/dashboard-action-items";
import { ParticipantAvatars } from "@/components/meetings/participant-avatars";
import { TODAY, formatMeetingDate, meetingJoinHref } from "@/lib/meetings/format";
import { actionItems, activity, currentUser, meetings, recordings } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CalendarPlusIcon,
  ListChecksIcon,
  MicIcon,
  RadioIcon,
  VideoIcon,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const ongoingMeetings = meetings.filter((meeting) => meeting.status === "ongoing");
  const upcomingMeetings = meetings.filter((meeting) => meeting.status === "upcoming");
  const todaysMeetingCount = meetings.filter(
    (meeting) => meeting.date === TODAY && meeting.status !== "canceled"
  ).length;
  const openActionItems = actionItems.filter((item) => !item.done);
  const readyRecordings = recordings.filter((recording) => recording.status === "ready");

  const firstName = currentUser.name.split(" ")[0];
  const todayLabel = new Date(`${TODAY}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const stats = [
    {
      label: "Meetings today",
      value: todaysMeetingCount,
      icon: CalendarDaysIcon,
      accent: "bg-lavender text-lavender-foreground",
    },
    {
      label: "Live now",
      value: ongoingMeetings.length,
      icon: RadioIcon,
      accent: "bg-primary/10 text-primary",
    },
    {
      label: "Open action items",
      value: openActionItems.length,
      icon: ListChecksIcon,
      accent: "bg-sage text-sage-foreground",
    },
    {
      label: "Recordings ready",
      value: readyRecordings.length,
      icon: MicIcon,
      accent: "bg-tag-yellow text-tag-yellow-foreground",
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {todayLabel} · Here&apos;s what&apos;s happening across your meetings today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href="/meetings" />}>
            <CalendarPlusIcon />
            Schedule meeting
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
        <div className="flex flex-col gap-6 lg:col-span-2">
          {ongoingMeetings.length > 0 ? (
            <Card>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-base font-semibold text-foreground">Live now</h2>
                  <Badge className="bg-primary/10 text-primary">{ongoingMeetings.length} ongoing</Badge>
                </div>
                <div className="flex flex-col gap-3">
                  {ongoingMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="relative flex size-2.5 shrink-0">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{meeting.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {meeting.startTime} – {meeting.endTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <ParticipantAvatars participants={meeting.participants} />
                        <Button size="sm" render={<Link href={meetingJoinHref(meeting)} />}>
                          <VideoIcon />
                          Join
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-base font-semibold text-foreground">Up next</h2>
                <Button variant="ghost" size="sm" render={<Link href="/meetings" />}>
                  View all
                  <ArrowRightIcon />
                </Button>
              </div>

              {upcomingMeetings.length > 0 ? (
                <div className="flex flex-col divide-y divide-border">
                  {upcomingMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="flex w-20 shrink-0 flex-col">
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                          {formatMeetingDate(meeting.date)}
                        </span>
                        <span className="text-sm font-semibold text-foreground">{meeting.startTime}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{meeting.title}</p>
                        {meeting.description ? (
                          <p className="truncate text-sm text-muted-foreground">{meeting.description}</p>
                        ) : null}
                      </div>
                      <ParticipantAvatars participants={meeting.participants} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming meetings scheduled.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-base font-semibold text-foreground">Action items</h2>
                <Badge className="bg-sage text-sage-foreground">{openActionItems.length} open</Badge>
              </div>
              <DashboardActionItems items={actionItems} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4">
              <h2 className="font-heading text-base font-semibold text-foreground">Team activity</h2>
              <ul className="flex flex-col gap-4">
                {activity.map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <Avatar size="sm">
                      <AvatarFallback>{item.user.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{item.user.name}</span> {item.action}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">{item.target}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.team}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-base font-semibold text-foreground">Recent recordings</h2>
                <Button variant="ghost" size="sm" render={<Link href="/recordings" />}>
                  View all
                  <ArrowRightIcon />
                </Button>
              </div>
              <ul className="flex flex-col divide-y divide-border">
                {readyRecordings.slice(0, 3).map((recording) => (
                  <li key={recording.id} className="first:pt-0 last:pb-0">
                    <Link
                      href={`/recordings/${recording.id}`}
                      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-muted/60"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-lavender text-lavender-foreground">
                        <MicIcon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{recording.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {recording.team} · {recording.durationLabel}
                        </p>
                      </div>
                    </Link>
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
