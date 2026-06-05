"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarControlsProps {
  weekStart:   number;
  onPrevWeek:  () => void;
  onNextWeek:  () => void;
  onGoToToday: () => void;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
] as const;

export function CalendarControls({
  weekStart,
  onPrevWeek,
  onNextWeek,
  onGoToToday,
}: CalendarControlsProps) {
  const [view, setView] = useState("blocks");

  // Build "June 2025" or "Jun – Jul 2025" if the week crosses month boundaries
  const weekEnd  = weekStart + 6 * 86_400_000;
  const dStart   = new Date(weekStart);
  const dEnd     = new Date(weekEnd);
  const sameMonth = dStart.getMonth() === dEnd.getMonth();
  const monthLabel = sameMonth
    ? `${MONTH_NAMES[dStart.getMonth()]} ${dStart.getFullYear()}`
    : `${MONTH_NAMES[dStart.getMonth()].slice(0,3)} – ${MONTH_NAMES[dEnd.getMonth()].slice(0,3)} ${dEnd.getFullYear()}`;

  const isCurrentWeek = (() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dow      = now.getDay();
    const toMonday = dow === 0 ? -6 : 1 - dow;
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() + toMonday);
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
          onValueChange={(next) => {
            const last = next[next.length - 1];
            if (last) setView(last);
          }}
          variant="outline"
          className="rounded-xl border-border/60 bg-muted/20 p-0.5"
        >
          <ToggleGroupItem value="blocks" className="rounded-lg px-3 text-sm">Blocks</ToggleGroupItem>
          <ToggleGroupItem value="card"   className="rounded-lg px-3 text-sm">Card</ToggleGroupItem>
          <ToggleGroupItem value="table"  className="rounded-lg px-3 text-sm">Table</ToggleGroupItem>
        </ToggleGroup>

        {/* Week navigation */}
        <div className="flex items-center gap-2">
          {!isCurrentWeek && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={onGoToToday}
            >
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
  );
}
