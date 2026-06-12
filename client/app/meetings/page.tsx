"use client";

import { MeetingCard } from "@/components/meetings/meeting-card";
import { ScheduleMeetingDialog } from "@/components/meetings/schedule-meeting-dialog";
import { meetings as initialMeetings } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { Meeting, MeetingStatus } from "@/types";
import { CalendarXIcon } from "lucide-react";
import { useState } from "react";

const FILTERS: { value: MeetingStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ongoing", label: "Ongoing" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ended", label: "Ended" },
  { value: "canceled", label: "Canceled" },
];

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [filter, setFilter] = useState<MeetingStatus | "all">("all");

  const filteredMeetings =
    filter === "all"
      ? meetings
      : meetings.filter((meeting) => meeting.status === filter);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Meetings
          </h1>
          <p className="text-sm text-muted-foreground">
            Schedule, join, and review your team&apos;s meetings.
          </p>
        </div>
        <ScheduleMeetingDialog
          onScheduled={(meeting) =>
            setMeetings((current) => [meeting, ...current])
          }
        />
      </div>

      <div className="inline-flex w-fit items-center gap-1 rounded-full bg-muted p-1">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={cn(
              "h-8 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors",
              filter === item.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filteredMeetings.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <CalendarXIcon className="size-8 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">No meetings here</p>
            <p className="text-sm text-muted-foreground">
              Try a different filter or schedule a new meeting.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
