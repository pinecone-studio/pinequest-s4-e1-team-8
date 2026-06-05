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
    <div className="flex shrink-0 border-b border-[#1a1d24]">
      <div
        className="shrink-0 border-r border-[#1a1d24]"
        style={{ width: CALENDAR_GUTTER_WIDTH }}
      />
      {weekDays.map((day) => (
        <div
          key={day.dayUnix}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-3",
            "border-l border-[#1a1d24]",
            day.isToday && "bg-[#13151c]",
          )}
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#3d4252]">
            {day.shortDay}
          </span>
          <span
            className={cn(
              "flex h-[26px] w-[26px] items-center justify-center rounded-full",
              "text-[13px] font-semibold tabular-nums",
              day.isToday
                ? "bg-[#2563eb] text-white shadow-[0_0_16px_rgba(37,99,235,0.5)]"
                : "text-[#5a6170]",
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
      className="flex shrink-0 border-b border-[#1a1d24]"
      style={{ minHeight: CALENDAR_ALL_DAY_HEIGHT_PX }}
    >
      <div
        className="flex shrink-0 items-center justify-center border-r border-[#1a1d24]"
        style={{ width: CALENDAR_GUTTER_WIDTH }}
      >
        <span className="text-[8px] font-medium uppercase tracking-widest text-[#2e3240]">
          All day
        </span>
      </div>
      {weekDays.map((day) => (
        <div
          key={day.dayUnix}
          className="flex flex-1 flex-col justify-center gap-[2px] border-l border-[#1a1d24] px-1 py-[3px]"
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
      className="flex w-full flex-col overflow-hidden rounded-2xl border border-[#1a1d24] bg-[#0d0e12]"
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
