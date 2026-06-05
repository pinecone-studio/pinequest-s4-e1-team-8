"use client";

import { useEffect, useRef, useCallback } from "react";
import type { CalendarEvent } from "@/lib/dashboard/calendar-types";
import { EVENT_COLORS } from "@/lib/dashboard/calendar-types";
import {
  HOUR_HEIGHT_PX,
  GRID_START_HOUR,
  TOTAL_GRID_HEIGHT_PX,
  QUARTER_HEIGHT_PX,
  layoutEventsForDay,
  getWeekDays,
  getTimeLabels,
  snapTo15Minutes,
  type WeekDay,
} from "@/lib/dashboard/calendar-engine";
import { CALENDAR_GUTTER_WIDTH } from "@/lib/dashboard/calendar-layout";
import { EventCard } from "./event-card";
import { CalendarFrame } from "./calendar-frame";
import { useCalendarViewport } from "./calendar-viewport-context";
import { cn } from "@/lib/utils";

interface CalendarGridProps {
  weekStart:      number;
  events:         CalendarEvent[];
  currentTimePx:  number | null;
  todayMidnight:  number;
  draggingId:     string | null;
  onDragStart:    (e: React.DragEvent, event: CalendarEvent, dayMidnight: number) => void;
  onDragEnd:      () => void;
  onDragOver:     (e: React.DragEvent, day: WeekDay) => void;
  onDrop:         (e: React.DragEvent) => void;
  onEdit:         (e: React.MouseEvent, event: CalendarEvent) => void;
  onCreateSlot:   (dayUnix: number, startUnix: number, e: React.MouseEvent) => void;
}

export function CalendarGrid({
  weekStart,
  events,
  currentTimePx,
  todayMidnight,
  draggingId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onEdit,
  onCreateSlot,
}: CalendarGridProps) {
  const scrollRef  = useRef<HTMLDivElement>(null);
  const { viewportHeight } = useCalendarViewport();
  const timeLabels = getTimeLabels();

  useEffect(() => {
    if (!scrollRef.current || currentTimePx === null) return;
    scrollRef.current.scrollTop = Math.max(0, currentTimePx - viewportHeight / 3);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eventsForDay = useCallback((day: WeekDay) => {
    const nextDay = day.dayUnix + 86_400_000;
    return events.filter(e => e.startUnix >= day.dayUnix && e.startUnix < nextDay);
  }, [events]);

  const allDayForDay = useCallback((day: WeekDay) =>
    events.filter(
      e => e.type === 'all-day' &&
           e.startUnix <= day.dayUnix &&
           e.endUnix   >= day.dayUnix + 86_400_000,
    ),
  [events]);

  const days = getWeekDays(weekStart, todayMidnight);

  return (
    <CalendarFrame
      weekStart={weekStart}
      todayMidnight={todayMidnight}
      renderAllDayCell={(day) =>
        allDayForDay(day).map((ev) => {
          const hex = EVENT_COLORS[ev.color].accent;
          return (
            <div
              key={ev.id}
              className="truncate rounded-sm px-1.5 py-[1px] text-[8px] font-medium"
              style={{
                backgroundColor: `${hex}22`,
                color: hex,
                border: `1px solid ${hex}44`,
              }}
            >
              {ev.title}
            </div>
          );
        })
      }
      bodyRef={scrollRef}
    >
      <div className="flex" style={{ height: TOTAL_GRID_HEIGHT_PX }}>
        <div
          className="relative shrink-0 border-r border-[#1a1d24]"
          style={{ width: CALENDAR_GUTTER_WIDTH, height: TOTAL_GRID_HEIGHT_PX }}
        >
          {timeLabels.map(({ hour, label, topPx }) => (
            <span
              key={hour}
              className="absolute right-[8px] -translate-y-1/2 text-[9px] tabular-nums text-[#2c3040]"
              style={{ top: topPx }}
            >
              {label}
            </span>
          ))}
        </div>

        {days.map(day => {
          const laid = layoutEventsForDay(eventsForDay(day), day.dayUnix);
          return (
            <DayColumn
              key={day.dayUnix}
              day={day}
              events={laid}
              draggingId={draggingId}
              currentTimePx={day.isToday ? currentTimePx : null}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onEdit={onEdit}
              onCreateSlot={onCreateSlot}
            />
          );
        })}
      </div>
    </CalendarFrame>
  );
}

interface DayColumnProps {
  day:           WeekDay;
  events:        CalendarEvent[];
  draggingId:    string | null;
  currentTimePx: number | null;
  onDragStart:   (e: React.DragEvent, event: CalendarEvent, dayMidnight: number) => void;
  onDragEnd:     () => void;
  onDragOver:    (e: React.DragEvent, day: WeekDay) => void;
  onDrop:        (e: React.DragEvent) => void;
  onEdit:        (e: React.MouseEvent, event: CalendarEvent) => void;
  onCreateSlot:  (dayUnix: number, startUnix: number, e: React.MouseEvent) => void;
}

function DayColumn({
  day,
  events,
  draggingId,
  currentTimePx,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onEdit,
  onCreateSlot,
}: DayColumnProps) {
  function handleColumnClick(e: React.MouseEvent) {
    const rect      = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const hourOffset = relativeY / HOUR_HEIGHT_PX + GRID_START_HOUR;
    const clickedUnix = day.dayUnix + hourOffset * 3_600_000;
    onCreateSlot(day.dayUnix, clickedUnix, e);
  }

  return (
    <div
      className={cn(
        "relative flex-1 cursor-crosshair border-l border-[#1a1d24]",
        day.isToday && "bg-[#0f1016]",
      )}
      style={{ height: TOTAL_GRID_HEIGHT_PX }}
      onClick={handleColumnClick}
      onDragOver={e => { e.preventDefault(); onDragOver(e, day); }}
      onDrop={onDrop}
    >
      <GridLines />

      {events.map(event => (
        <EventCard
          key={event.id}
          event={event}
          isDragging={event.id === draggingId}
          onDragStart={(e, ev) => onDragStart(e, ev, day.dayUnix)}
          onDragEnd={onDragEnd}
          onEdit={onEdit}
        />
      ))}

      {currentTimePx !== null && <CurrentTimeLine topPx={currentTimePx} />}
    </div>
  );
}

function GridLines() {
  const totalSlots = TOTAL_GRID_HEIGHT_PX / QUARTER_HEIGHT_PX;
  return (
    <>
      {Array.from({ length: totalSlots }, (_, i) => (
        <div
          key={i}
          className="pointer-events-none absolute left-0 right-0 border-t"
          style={{
            top:         i * QUARTER_HEIGHT_PX,
            borderColor: i % 4 === 0 ? '#1a1d24' : '#111318',
          }}
        />
      ))}
    </>
  );
}

function CurrentTimeLine({ topPx }: { topPx: number }) {
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
      style={{ top: topPx }}
    >
      <div className="h-[7px] w-[7px] shrink-0 -translate-x-[3.5px] rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
      <div className="h-px flex-1 bg-cyan-400/60" />
    </div>
  );
}

export type { CalendarGridProps };
export { snapTo15Minutes, HOUR_HEIGHT_PX, GRID_START_HOUR };
