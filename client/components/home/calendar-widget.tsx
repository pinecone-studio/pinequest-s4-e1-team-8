"use client";

import { Button } from "@/components/ui/button";
import { useGoogleAgenda } from "@/lib/home/use-google-agenda";
import { getDateKey } from "@/lib/home/google-agenda-utils";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useMemo, useState } from "react";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MAX_VISIBLE_DOTS = 5;

function DayEventDots({ taskCount }: { taskCount: number }) {
  if (taskCount <= 0) {
    return <span className="h-1" aria-hidden />;
  }

  const dotCount = Math.min(taskCount, MAX_VISIBLE_DOTS);

  return (
    <div
      className="flex h-1 min-w-7 items-center justify-center gap-px"
      aria-hidden
    >
      {Array.from({ length: dotCount }, (_, index) => (
        <span key={index} className="size-1 shrink-0 rounded-full bg-primary" />
      ))}
    </div>
  );
}

function getMonthGrid(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

export function CalendarWidget() {
  const { events, connected } = useGoogleAgenda();
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const days = useMemo(
    () => getMonthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  const eventCountByDate = useMemo(() => {
    const counts = new Map<string, number>();

    if (!connected) {
      return counts;
    }

    for (const event of events) {
      counts.set(event.dateKey, (counts.get(event.dateKey) ?? 0) + 1);
    }

    return counts;
  }, [connected, events]);

  const monthLabel = cursor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative flex flex-col gap-3 overflow-visible">
      <div className="flex items-center justify-between">
        <p className="font-heading text-sm font-semibold text-foreground">
          {monthLabel}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={() =>
              setCursor(
                (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
              )
            }
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={() =>
              setCursor(
                (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
              )
            }
            aria-label="Next month"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1.5 overflow-visible text-center">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
        ))}

        {days.map((date) => {
          const dateKey = getDateKey(date);
          const isCurrentMonth = date.getMonth() === cursor.getMonth();
          const isToday =
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();
          const taskCount = eventCountByDate.get(dateKey) ?? 0;
          const hasEvents = taskCount > 0;
          const taskLabel = `+${taskCount}`;

          return (
            <div
              key={date.toISOString()}
              className="relative flex flex-col items-center justify-center gap-1 overflow-visible py-0.5"
            >
              <button
                type="button"
                aria-label={hasEvents ? `${date.getDate()}, ${taskCount} tasks` : undefined}
                className={cn(
                  "group/date relative z-10 flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : hasEvents
                      ? "text-foreground hover:bg-primary/15 hover:text-primary"
                      : isCurrentMonth
                        ? "text-foreground hover:bg-muted"
                        : "text-muted-foreground/40 hover:bg-muted",
                )}
              >
                {date.getDate()}
                {hasEvents ? (
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-3 py-1.5 text-xs font-medium text-foreground shadow-lg group-hover/date:block">
                    {taskLabel}
                  </span>
                ) : null}
              </button>
              <DayEventDots taskCount={taskCount} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
