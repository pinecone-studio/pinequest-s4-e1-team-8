"use client";

import { AgendaEventCards } from "@/components/home/agenda-event-cards";
import { Button } from "@/components/ui/button";
import {
  disconnectGoogleWorkspace,
  startGoogleWorkspaceConnect,
} from "@/lib/api/google-workspace";
import { groupEventsByDate, formatDayHeading } from "@/lib/home/google-agenda-utils";
import { useGoogleAgenda } from "@/lib/home/use-google-agenda";
import { AGENDA_DAYS_AHEAD } from "@/lib/home/agenda-types";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";

export function AgendaPanel() {
  const { events, connected, isLoading, error, reload } = useGoogleAgenda();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const groupedEvents = groupEventsByDate(events);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectGoogleWorkspace();
      await reload();
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-heading text-sm font-semibold text-foreground">
          Next {AGENDA_DAYS_AHEAD} days
        </p>
        {connected ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 rounded-full px-3 text-xs text-muted-foreground"
            disabled={isDisconnecting}
            onClick={() => void handleDisconnect()}
          >
            {isDisconnecting ? "Disconnecting…" : "Disconnect"}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-full px-3 text-xs"
            onClick={() => startGoogleWorkspaceConnect("/home")}
          >
            Connect Google
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Loading calendar…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : connected === false ? (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Connect Google Workspace to see your upcoming meetings here.
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          No upcoming events in the next {AGENDA_DAYS_AHEAD} days.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groupedEvents.map(({ dateKey, events: dayEvents }) => (
            <div key={dateKey} className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {formatDayHeading(dateKey)}
              </p>
              <AgendaEventCards events={dayEvents} compact />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
