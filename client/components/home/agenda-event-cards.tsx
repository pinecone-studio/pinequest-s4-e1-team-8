"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { AgendaEvent } from "@/lib/home/agenda-types";
import { cn } from "@/lib/utils";
import { ClockIcon, VideoIcon } from "lucide-react";
import { useState } from "react";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

type AgendaEventCardsProps = {
  events: AgendaEvent[];
  compact?: boolean;
};

export function AgendaEventCards({ events, compact = false }: AgendaEventCardsProps) {
  const [autoJoin, setAutoJoin] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(events.map((event) => [event.id, event.autoJoinDefault])),
  );

  return (
    <div className={cn("flex flex-col gap-3", compact && "gap-2")}>
      {events.map((event) => (
        <div
          key={event.id}
          className={cn(
            "relative flex flex-col gap-2 rounded-xl border border-border bg-card p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm",
            event.meetingUrl ? "pb-11" : "pb-3",
            event.isNow && "border-primary/40 ring-1 ring-primary/20",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
            <Switch
              checked={autoJoin[event.id] ?? false}
              onCheckedChange={(checked) =>
                setAutoJoin((current) => ({ ...current, [event.id]: checked }))
              }
              className="shrink-0 focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <ClockIcon className="size-3.5 shrink-0" />
            <span className="shrink-0">
              {event.endLabel
                ? `${event.startLabel} - ${event.endLabel}`
                : event.startLabel}
            </span>
            <Avatar size="sm" className="ml-1">
              <AvatarFallback className="text-[10px]">
                {getInitials(event.organizer)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{event.isOwner ? "You" : event.organizer}</span>
          </div>

          {event.meetingUrl ? (
            <Button
              size="sm"
              className={cn(
                "absolute right-2.5 bottom-2.5 gap-1.5 rounded-lg px-3 text-xs focus-visible:ring-2 focus-visible:ring-ring/50",
                event.isNow
                  ? "bg-primary text-primary-foreground hover:bg-primary/80"
                  : "bg-primary/10 text-primary hover:bg-primary/20",
              )}
              render={
                <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" />
              }
            >
              <VideoIcon className="size-3.5" />
              {event.isNow ? "Join now" : "Start"}
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
