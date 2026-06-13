import type { MeetingListItem } from "@/app/meeting";
import { ActivityFeedCard } from "@/components/dashboard/activity-feed-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  Loader2Icon,
  MicIcon,
  VideoIcon,
} from "lucide-react";
import Link from "next/link";

type ActivityFeedProps = {
  meetings: MeetingListItem[];
  todayLabel: string;
};

export function ActivityFeed({ meetings, todayLabel }: ActivityFeedProps) {
  const { user } = useUser();

  const readyMeetings = meetings.filter(
    (meeting) => meeting.transcriptionStatus === "done",
  );
  const inProgressMeetings = meetings.filter(
    (meeting) =>
      meeting.transcriptionStatus === "pending" ||
      meeting.transcriptionStatus === "processing",
  );
  const failedMeetings = meetings.filter(
    (meeting) => meeting.transcriptionStatus === "failed",
  );

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Welcome back{user?.firstName ? `, ${user.firstName}!` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {todayLabel} · Here&apos;s what&apos;s happening across your
            meetings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            className="h-11 gap-2 px-5 text-base [&_svg:not([class*='size-'])]:size-5"
            render={<Link href="/meetings" />}
          >
            <CalendarDaysIcon />
            View meetings
          </Button>
          <Button
            size="lg"
            className="h-11 gap-2 px-5 text-base [&_svg:not([class*='size-'])]:size-5"
            render={<Link href="/meeting" />}
          >
            <VideoIcon />
            Start meeting
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="ring-1 ring-white/10">
              <CardContent className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    stat.accent,
                  )}
                >
                  <stat.icon className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-base font-semibold text-foreground">
          Recent activity
        </h2>

        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {meetings.slice(0, 6).map((meeting, index) => (
              <motion.div
                key={meeting.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ActivityFeedCard meeting={meeting} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {meetings.length > 6 ? (
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            render={<Link href="/meetings" />}
          >
            View all meetings
            <ArrowRightIcon />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
