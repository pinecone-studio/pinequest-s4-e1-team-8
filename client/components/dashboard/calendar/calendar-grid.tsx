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
import { EventCard } from "./event-card";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────
const GUTTER_WIDTH    = 52;   // px — left time-axis column width
const VIEWPORT_HEIGHT = 600;  // px — height of the scrollable time window (~9 hrs visible)

// ─── Types ────────────────────────────────────────────────────────────────────
interface CalendarGridProps {
  weekStart:       number;
  events:          CalendarEvent[];
  currentTimePx:   number | null;
  todayMidnight:   number;
  draggingId:      string | null;
  onDragStart:     (e: React.DragEvent, event: CalendarEvent, dayMidnight: number) => void;
  onDragEnd:       () => void;
  onDragOver:      (e: React.DragEvent, day: WeekDay) => void;
  onDrop:          (e: React.DragEvent) => void;
}

// ─── Main component ───────────────────────────────────────────────────────────
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
}: CalendarGridProps) {
  const scrollRef  = useRef<HTMLDivElement>(null);
  const weekDays   = getWeekDays(weekStart, todayMidnight);
  const timeLabels = getTimeLabels();

  // Auto-scroll to ~1/3 above current time on initial mount
  useEffect(() => {
    if (!scrollRef.current || currentTimePx === null) return;
    scrollRef.current.scrollTop = Math.max(0, currentTimePx - VIEWPORT_HEIGHT / 3);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Events for one day column
  const eventsForDay = useCallback((day: WeekDay) => {
    const nextDay = day.dayUnix + 86_400_000;
    return events.filter(e => e.startUnix >= day.dayUnix && e.startUnix < nextDay);
  }, [events]);

  // All-day events that span a given day
  const allDayForDay = useCallback((day: WeekDay) =>
    events.filter(
      e => e.type === 'all-day' &&
           e.startUnix <= day.dayUnix &&
           e.endUnix   >= day.dayUnix + 86_400_000,
    ),
  [events]);

  const hasAnyAllDay = weekDays.some(d => allDayForDay(d).length > 0);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-[#1a1d24] bg-[#0d0e12]"
      style={{ minWidth: GUTTER_WIDTH + 7 * 80 }}
    >

      {/* ── Day-of-week header ─────────────────────────────────────────────── */}
      <div className="flex border-b border-[#1a1d24]">
        {/* Gutter spacer */}
        <div
          className="shrink-0 border-r border-[#1a1d24]"
          style={{ width: GUTTER_WIDTH }}
        />
        {weekDays.map(day => (
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

      {/* ── All-day shelf ─────────────────────────────────────────────────── */}
      {hasAnyAllDay && (
        <div className="flex min-h-[28px] border-b border-[#1a1d24]">
          <div
            className="flex shrink-0 items-center justify-center border-r border-[#1a1d24]"
            style={{ width: GUTTER_WIDTH }}
          >
            <span className="text-[8px] font-medium uppercase tracking-widest text-[#2e3240]">
              All day
            </span>
          </div>
          {weekDays.map(day => {
            const pills = allDayForDay(day);
            return (
              <div
                key={day.dayUnix}
                className="flex flex-1 flex-col justify-center gap-[2px] border-l border-[#1a1d24] px-1 py-[3px]"
              >
                {pills.map(ev => {
                  const hex = EVENT_COLORS[ev.color].accent;
                  return (
                    <div
                      key={ev.id}
                      className="truncate rounded-sm px-1.5 py-[1px] text-[8px] font-medium"
                      style={{
                        backgroundColor: `${hex}22`,
                        color:           hex,
                        border:          `1px solid ${hex}44`,
                      }}
                    >
                      {ev.title}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Scrollable time grid ──────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{ maxHeight: VIEWPORT_HEIGHT }}
      >
        <div className="flex" style={{ height: TOTAL_GRID_HEIGHT_PX }}>

          {/* ── Left time axis ─────────────────────────────────────────── */}
          <div
            className="relative shrink-0 border-r border-[#1a1d24]"
            style={{ width: GUTTER_WIDTH, height: TOTAL_GRID_HEIGHT_PX }}
          >
            {timeLabels.map(({ hour, label, topPx }) => (
              <span
                key={hour}
                className="absolute right-[8px] text-[9px] tabular-nums text-[#2c3040] -translate-y-1/2"
                style={{ top: topPx }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* ── Day columns ──────────────────────────────────────────────── */}
          {weekDays.map(day => {
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
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Day column ────────────────────────────────────────────────────────────────
interface DayColumnProps {
  day:          WeekDay;
  events:       CalendarEvent[];
  draggingId:   string | null;
  currentTimePx: number | null;
  onDragStart:  (e: React.DragEvent, event: CalendarEvent, dayMidnight: number) => void;
  onDragEnd:    () => void;
  onDragOver:   (e: React.DragEvent, day: WeekDay) => void;
  onDrop:       (e: React.DragEvent) => void;
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
}: DayColumnProps) {
  return (
    <div
      className={cn(
        "relative flex-1 border-l border-[#1a1d24]",
        day.isToday && "bg-[#0f1016]",
      )}
      style={{ height: TOTAL_GRID_HEIGHT_PX }}
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
        />
      ))}

      {/* Current time indicator — only rendered in today's column */}
      {currentTimePx !== null && (
        <CurrentTimeLine topPx={currentTimePx} />
      )}
    </div>
  );
}

// ─── Grid lines ────────────────────────────────────────────────────────────────
// One div per 15-minute interval. Hour lines (#1a1d24) are more visible than
// quarter-hour lines (#141618) to create a clear visual rhythm.
function GridLines() {
  const totalSlots = (TOTAL_GRID_HEIGHT_PX / QUARTER_HEIGHT_PX);
  return (
    <>
      {Array.from({ length: totalSlots }, (_, i) => {
        const isHour = i % 4 === 0;
        return (
          <div
            key={i}
            className="pointer-events-none absolute left-0 right-0 border-t"
            style={{
              top:         i * QUARTER_HEIGHT_PX,
              borderColor: isHour ? '#1a1d24' : '#111318',
            }}
          />
        );
      })}
    </>
  );
}

// ─── Current time indicator ────────────────────────────────────────────────────
function CurrentTimeLine({ topPx }: { topPx: number }) {
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
      style={{ top: topPx }}
    >
      {/* Dot */}
      <div className="h-[7px] w-[7px] shrink-0 rounded-full bg-cyan-400 -translate-x-[3.5px] shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
      {/* Line */}
      <div className="h-px flex-1 bg-cyan-400/60" />
    </div>
  );
}

// ─── Exports ───────────────────────────────────────────────────────────────────
export type { CalendarGridProps };
export { snapTo15Minutes, HOUR_HEIGHT_PX, GRID_START_HOUR };
