"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarXIcon, VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeetingListCard } from "@/components/meetings/meeting-list-card";
import { fetchMeetings, type MeetingListItem, type MeetingTranscriptionStatus } from "@/app/meeting";
import { cn } from "@/lib/utils";

type FilterValue = MeetingTranscriptionStatus | "none" | "all";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "done", label: "Ready" },
  { value: "processing", label: "Processing" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "none", label: "No recording" },
];

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>("all");

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

  const filteredMeetings =
    filter === "all"
      ? meetings
      : meetings.filter((meeting) => (meeting.transcriptionStatus ?? "none") === filter);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Meetings</h1>
          <p className="text-sm text-muted-foreground">
            Review your past meetings, recordings, and AI summaries.
          </p>
        </div>
        <Button
          size="lg"
          className="h-11 gap-2 px-5 text-base [&_svg:not([class*='size-'])]:size-5"
          render={<Link href="/meeting" />}
        >
          <VideoIcon />
          New meeting
        </Button>
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

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filteredMeetings.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMeetings.map((meeting) => (
            <MeetingListCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <CalendarXIcon className="size-8 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">No meetings here</p>
            <p className="text-sm text-muted-foreground">
              {meetings.length === 0
                ? "Start a meeting to see it appear here."
                : "Try a different filter."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
