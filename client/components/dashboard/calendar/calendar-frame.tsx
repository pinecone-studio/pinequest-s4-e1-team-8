"use client";

import { getWeekDays, type WeekDay } from "@/lib/dashboard/calendar-engine";
import {
  CALENDAR_ALL_DAY_HEIGHT_PX,
  CALENDAR_GUTTER_WIDTH,
  CALENDAR_MIN_WIDTH,
  CALENDAR_VIEWPORT_HEIGHT,
  getCalendarShellHeight,
} from "@/lib/dashboard/calendar-layout";
import { cn } from "@/lib/utils";
import { useCalendarViewport } from "./calendar-viewport-context";

interface CalendarFrameProps {
  weekStart: number;
  todayMidnight: number;
  children: React.ReactNode;
  renderAllDayCell?: (day: WeekDay) => React.ReactNode;
  bodyClassName?: string;
  bodyRef?: React.Ref<HTMLDivElement>;
}

export function CalendarDayHeader({
  weekStart,
  todayMidnight,
}: {
  weekStart: number;
  todayMidnight: number;
}) {
  const weekDays = getWeekDays(weekStart, todayMidnight);

  return (
    <div className="flex shrink-0 border-b border-border">
      <div
        className="shrink-0 border-r border-border"
        style={{ width: CALENDAR_GUTTER_WIDTH }}
      />
      {weekDays.map((day) => (
        <div
          key={day.dayUnix}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-3",
            "border-l border-border",
            day.isToday && "bg-muted/30",
          )}
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {day.shortDay}
          </span>
          <span
            className={cn(
              "flex h-[26px] w-[26px] items-center justify-center rounded-full",
              "text-[13px] font-semibold tabular-nums",
              day.isToday
                ? "bg-[#2563eb] text-white shadow-[0_0_16px_rgba(37,99,235,0.5)]"
                : "text-muted-foreground",
            )}
          >
            {day.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function CalendarAllDayShelf({
  weekStart,
  todayMidnight,
  renderAllDayCell,
}: {
  weekStart: number;
  todayMidnight: number;
  renderAllDayCell?: (day: WeekDay) => React.ReactNode;
}) {
  const weekDays = getWeekDays(weekStart, todayMidnight);

  return (
    <div
      className="flex shrink-0 border-b border-border"
      style={{ minHeight: CALENDAR_ALL_DAY_HEIGHT_PX }}
    >
      <div
        className="flex shrink-0 items-center justify-center border-r border-border"
        style={{ width: CALENDAR_GUTTER_WIDTH }}
      >
        <span className="text-[8px] font-medium uppercase tracking-widest text-muted-foreground">
          All day
        </span>
      </div>
      {weekDays.map((day) => (
        <div
          key={day.dayUnix}
          className="flex flex-1 flex-col justify-center gap-1 border-l border-border px-1.5 py-1.5"
        >
          {renderAllDayCell?.(day)}
        </div>
      ))}
    </div>
  );
}

export function CalendarFrame({
  weekStart,
  todayMidnight,
  children,
  renderAllDayCell,
  bodyClassName,
  bodyRef,
}: CalendarFrameProps) {
  const { viewportHeight } = useCalendarViewport();
  const shellHeight = getCalendarShellHeight(viewportHeight);

  return (
    <div
      className="flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-popover"
      style={{
        minWidth: CALENDAR_MIN_WIDTH,
        height: shellHeight,
      }}
    >
      <CalendarDayHeader weekStart={weekStart} todayMidnight={todayMidnight} />
      <CalendarAllDayShelf
        weekStart={weekStart}
        todayMidnight={todayMidnight}
        renderAllDayCell={renderAllDayCell}
      />
      <div
        ref={bodyRef}
        className={cn("min-h-0 flex-1 overflow-y-auto", bodyClassName)}
        style={{
          height: viewportHeight,
          maxHeight: viewportHeight,
        }}
      >
        {children}
      </div>
    </div>
  );
}
export { CALENDAR_VIEWPORT_HEIGHT };
