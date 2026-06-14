"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { todaysAgenda } from "@/lib/home/agenda-data";
import { cn } from "@/lib/utils";
import { ClockIcon, VideoIcon } from "lucide-react";
import { useState } from "react";

export function AgendaPanel() {
  const [autoJoin, setAutoJoin] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(todaysAgenda.map((event) => [event.id, event.autoJoinDefault])),
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="font-heading text-sm font-semibold text-foreground">Today&apos;s agenda</p>

      <div className="flex flex-col gap-3">
        {todaysAgenda.map((event) => (
          <div
            key={event.id}
            className={cn(
              "flex flex-col gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
              event.isNow && "ring-primary/40",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ClockIcon className="size-3.5" />
                  <span>
                    {event.startLabel} - {event.endLabel}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {event.isOwner ? "Organized by you" : `Organized by ${event.organizer}`}
                </p>
              </div>

              <label className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground">Auto-join</span>
                <Switch
                  checked={autoJoin[event.id]}
                  onCheckedChange={(checked) =>
                    setAutoJoin((current) => ({ ...current, [event.id]: checked }))
                  }
                  className="focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </label>
            </div>

            {event.meetingUrl ? (
              <Button
                size="sm"
                className={cn(
                  "w-full gap-2 focus-visible:ring-2 focus-visible:ring-ring/50",
                  event.isNow
                    ? "bg-primary text-primary-foreground hover:bg-primary/80"
                    : "bg-primary/10 text-primary hover:bg-primary/20",
                )}
                render={<a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" />}
              >
                <VideoIcon className="size-4" />
                {event.isNow ? "Join now" : "Start"}
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
