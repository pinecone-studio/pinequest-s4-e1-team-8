"use client";

import { fetchMeetings, type MeetingListItem, type MeetingTranscriptionStatus } from "@/app/meeting";
import { parseRoomCodeInput } from "@/app/meeting/utils/parse-room-code";
import { MeetingActivityCard } from "@/components/meetings/meeting-activity-card";
import { MeetingScheduleSidebar } from "@/components/meetings/meeting-schedule-sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ArrowRightIcon,
  CalendarXIcon,
  LayoutGridIcon,
  ListIcon,
  SlidersHorizontalIcon,
  VideoIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type StatusFilter = MeetingTranscriptionStatus | "none" | "all";
type MeetingScope = "mine" | "all" | "shared";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "done", label: "Ready" },
  { value: "processing", label: "Processing" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "none", label: "No recording" },
];

const SCOPE_TITLES: Record<MeetingScope, string> = {
  mine: "My meetings",
  all: "All meetings",
  shared: "Shared with me",
};

export default function MeetingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scope = (searchParams.get("scope") as MeetingScope | null) ?? "mine";

  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  const handleJoinWithCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = parseRoomCodeInput(joinCode);

    if (!parsed) {
      setJoinError(true);
      return;
    }

    setJoinError(false);
    setJoinDialogOpen(false);

    const params = new URLSearchParams({
      meetingId: parsed.meetingId,
      roomName: parsed.roomName,
    });

    router.push(`/meeting?${params.toString()}`);
  };

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

  const filteredMeetings = useMemo(() => {
    if (scope === "shared") return [];

    return meetings.filter((meeting) => {
      return statusFilter === "all" || (meeting.transcriptionStatus ?? "none") === statusFilter;
    });
  }, [meetings, scope, statusFilter]);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-32 right-0 size-112 rounded-full bg-lavender/40 blur-[120px] dark:bg-lavender/10" />
      <div className="pointer-events-none absolute top-1/3 left-1/4 size-96 rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden px-8 py-6">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <h2 className="font-heading text-2xl font-bold text-foreground">{SCOPE_TITLES[scope]}</h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode((mode) => (mode === "list" ? "grid" : "list"))}
              className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
              aria-label="Toggle layout"
            >
              {viewMode === "list" ? (
                <LayoutGridIcon className="size-4" />
              ) : (
                <ListIcon className="size-4" />
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label="Filter and sort"
              >
                <SlidersHorizontalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {STATUS_FILTERS.map((item) => (
                  <DropdownMenuItem
                    key={item.value}
                    onClick={() => setStatusFilter(item.value)}
                    className={cn(
                      statusFilter === item.value && "bg-accent text-accent-foreground",
                    )}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger
                render={
                  <Button className="h-9 gap-2 rounded-lg bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/80" />
                }
              >
                <VideoIcon className="size-4" />
                Enter a meeting
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enter a meeting</DialogTitle>
                  <DialogDescription>
                    Paste a meeting link or enter a room code to join.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleJoinWithCode} className="flex flex-col gap-2">
                  <Input
                    value={joinCode}
                    onChange={(event) => {
                      setJoinCode(event.target.value);
                      setJoinError(false);
                    }}
                    placeholder="Room code or meeting link"
                    className="h-10 rounded-xl bg-transparent px-3.5 focus-visible:ring-primary/50"
                    aria-invalid={joinError}
                    autoFocus
                  />
                  {joinError ? (
                    <p className="text-sm text-destructive">
                      Enter a valid room code or meeting link.
                    </p>
                  ) : null}
                  <DialogFooter className="-mx-0 -mb-0 mt-1 rounded-b-none border-t-0 bg-transparent p-0">
                    <Button
                      type="submit"
                      disabled={!joinCode.trim()}
                      className="h-10 w-full gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 sm:w-auto"
                    >
                      Join meeting
                      <ArrowRightIcon className="size-4" />
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-none">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[0, 1, 2].map((key) => (
                <div key={key} className="h-40 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : filteredMeetings.length > 0 ? (
            <div
              className={cn(
                "pb-4",
                viewMode === "list" ? "flex flex-col gap-4" : "grid gap-4 md:grid-cols-2",
              )}
            >
              {filteredMeetings.map((meeting) => (
                <MeetingActivityCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
              <CalendarXIcon className="size-8 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">No meetings here</p>
                <p className="text-sm text-muted-foreground">
                  {scope === "shared"
                    ? "Nobody has shared a meeting with you yet."
                    : meetings.length === 0
                      ? "Start a meeting to see it appear here."
                      : "Try a different filter."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <MeetingScheduleSidebar />
    </div>
  );
}
