"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { todaysAgenda } from "@/lib/home/agenda-data";
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

export function AgendaPanel() {
  const [autoJoin, setAutoJoin] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(todaysAgenda.map((event) => [event.id, event.autoJoinDefault])),
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="font-heading text-sm font-semibold text-foreground">Schedule</p>

      <div className="flex flex-col gap-3">
        {todaysAgenda.map((event) => (
          <div
            key={event.id}
            className={cn(
              "relative flex flex-col gap-2 rounded-xl border border-border p-3 pb-11 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm",
              event.isNow && "border-primary/40",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
              <Switch
                checked={autoJoin[event.id]}
                onCheckedChange={(checked) =>
                  setAutoJoin((current) => ({ ...current, [event.id]: checked }))
                }
                className="shrink-0 focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>

            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <ClockIcon className="size-3.5 shrink-0" />
              <span className="shrink-0">
                {event.startLabel} - {event.endLabel}
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
                render={<a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" />}
              >
                <VideoIcon className="size-3.5" />
                {event.isNow ? "Join now" : "Start"}
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
