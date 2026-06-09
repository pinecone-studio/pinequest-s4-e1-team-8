"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarControlsProps {
  weekStart:   number;
  onPrevWeek:  () => void;
  onNextWeek:  () => void;
  onGoToToday: () => void;
  onNewEvent:  (e: React.MouseEvent) => void;
  isSyncing:   boolean;
  lastSynced:  Date | null;
  onRefresh:   () => void;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
] as const;

function formatRelative(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 10)  return 'just now';
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function CalendarControls({
  weekStart,
  onPrevWeek,
  onNextWeek,
  onGoToToday,
  onNewEvent,
  isSyncing,
  lastSynced,
  onRefresh,
}: CalendarControlsProps) {
  const [view, setView] = useState("blocks");

  // Tick every 15 s so the "X ago" label stays fresh between syncs
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const weekEnd    = weekStart + 6 * 86_400_000;
  const dStart     = new Date(weekStart);
  const dEnd       = new Date(weekEnd);
  const sameMonth  = dStart.getMonth() === dEnd.getMonth();
  const monthLabel = sameMonth
    ? `${MONTH_NAMES[dStart.getMonth()]} ${dStart.getFullYear()}`
    : `${MONTH_NAMES[dStart.getMonth()].slice(0,3)} – ${MONTH_NAMES[dEnd.getMonth()].slice(0,3)} ${dEnd.getFullYear()}`;

  const isCurrentWeek = (() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dow = now.getDay();
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow));
    return weekStart === thisMonday.getTime();
  })();

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Website / Apps / <span className="text-foreground">Dribbble Shot</span>
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* View toggle */}
        <ToggleGroup
          value={[view]}
          onValueChange={(next) => { const last = next[next.length - 1]; if (last) setView(last); }}
          variant="outline"
          className="rounded-xl border-border/60 bg-muted/20 p-0.5"
        >
          <ToggleGroupItem value="blocks" className="rounded-lg px-3 text-sm">Blocks</ToggleGroupItem>
          <ToggleGroupItem value="card"   className="rounded-lg px-3 text-sm">Card</ToggleGroupItem>
          <ToggleGroupItem value="table"  className="rounded-lg px-3 text-sm">Table</ToggleGroupItem>
        </ToggleGroup>

        {/* New Event */}
        <Button
          size="sm"
          className="gap-1.5 rounded-xl bg-[#2563eb] text-xs text-white hover:bg-[#1d4ed8]"
          onClick={onNewEvent}
        >
          <Plus className="size-3.5" />
          New Event
        </Button>

        {/* Week navigation + sync indicator */}
        <div className="flex items-center gap-3">
          {/* Sync indicator */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              title={lastSynced ? `Last synced ${formatRelative(lastSynced)}` : 'Sync with Google Calendar'}
              className="text-muted-foreground transition-colors hover:text-muted-foreground disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={cn(
                  "size-3.5 transition-colors",
                  isSyncing ? "animate-spin text-[#2563eb]" : "text-muted-foreground",
                )}
              />
            </button>
            <span className="min-w-[56px] text-[10px] tabular-nums text-muted-foreground">
              {isSyncing
                ? 'Syncing…'
                : lastSynced
                  ? formatRelative(lastSynced)
                  : ''}
            </span>
          </div>

          {/* Today + week arrows */}
          <div className="flex items-center gap-2">
            {!isCurrentWeek && (
              <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={onGoToToday}>
                Today
              </Button>
            )}
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon-sm" onClick={onPrevWeek} aria-label="Previous week">
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-[120px] text-center text-sm font-medium tabular-nums">
                {monthLabel}
              </span>
              <Button variant="ghost" size="icon-sm" onClick={onNextWeek} aria-label="Next week">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
