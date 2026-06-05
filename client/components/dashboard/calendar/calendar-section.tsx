"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import type { CalendarEvent } from "@/lib/dashboard/calendar-types";
import {
  getWeekStart,
  getTodayMidnight,
  HOUR_HEIGHT_PX,
  GRID_START_HOUR,
  TOTAL_GRID_HEIGHT_PX,
  snapTo15Minutes,
  type WeekDay,
} from "@/lib/dashboard/calendar-engine";
import { CalendarControls } from "./calendar-controls";
import { CalendarGrid } from "./calendar-grid";
import { ConnectCalendarBanner } from "./connect-calendar";

// How long to wait after a drag move before firing the PATCH API call (ms)
const DEBOUNCE_MS = 500;

export function CalendarSection() {
  const todayMidnight = getTodayMidnight();

  // ─── Week state ──────────────────────────────────────────────────────────────
  const [weekStart, setWeekStart] = useState(() => getWeekStart(Date.now()));

  const prevWeek   = useCallback(() => setWeekStart(w => w - 7 * 86_400_000), []);
  const nextWeek   = useCallback(() => setWeekStart(w => w + 7 * 86_400_000), []);
  const goToToday  = useCallback(() => setWeekStart(getWeekStart(Date.now())), []);

  // ─── Events + connection state ────────────────────────────────────────────────
  const [events,    setEvents]    = useState<CalendarEvent[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    let cancelled = false;
    setConnected(null);
    (async () => {
      try {
        const res  = await fetch(`/api/google-calendar?weekStart=${weekStart}`);
        const data = (await res.json()) as {
          connected?: boolean;
          events?:    CalendarEvent[];
          error?:     string;
        };
        if (cancelled) return;
        if (data.connected === false) {
          setConnected(false);
          setEvents([]);
        } else {
          setConnected(true);
          setEvents(data.events ?? []);
        }
      } catch {
        if (!cancelled) {
          setConnected(false);
          setEvents([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [weekStart]);

  // ─── Current time ──────────────────────────────────────────────────────────
  const [currentTimePx, setCurrentTimePx] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      const now = new Date();
      const localMidnight = new Date(now);
      localMidnight.setHours(0, 0, 0, 0);
      const offsetHours = (now.getTime() - localMidnight.getTime()) / 3_600_000;
      const px = (offsetHours - GRID_START_HOUR) * HOUR_HEIGHT_PX;
      setCurrentTimePx(px >= 0 && px <= TOTAL_GRID_HEIGHT_PX ? px : null);
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // ─── Drag-and-drop ─────────────────────────────────────────────────────────
  const [draggingId, setDraggingId] = useState<string | null>(null);

  interface DragSession {
    event:          CalendarEvent;
    offsetY:        number;       // px from top of card where grab started
    dayMidnightUnix: number;
    colRect:        DOMRect | null;
  }
  const dragRef    = useRef<DragSession | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDragStart = useCallback((
    e: React.DragEvent,
    event: CalendarEvent,
    dayMidnight: number,
  ) => {
    setDraggingId(event.id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragRef.current = {
      event,
      offsetY:         e.clientY - rect.top,
      dayMidnightUnix: dayMidnight,
      colRect:         null,
    };

    // Replace the browser ghost with a transparent element so we can draw
    // our own preview via CSS opacity on the original card
    const ghost = document.createElement('div');
    ghost.style.cssText = 'position:fixed;top:-9999px;opacity:0;';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    requestAnimationFrame(() => document.body.removeChild(ghost));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, day: WeekDay) => {
    e.preventDefault();
    // Capture ref synchronously — it may be nulled by drop/dragend on the next tick
    const session = dragRef.current;
    if (!session) return;

    const colEl = e.currentTarget as HTMLElement;
    const rect  = colEl.getBoundingClientRect();
    // relativeY is the position within the day column in grid pixels
    const relativeY = e.clientY - rect.top - session.offsetY;
    const durationMs = session.event.endUnix - session.event.startUnix;

    // Convert pixel offset to a local time offset
    const newStartHourOffset = relativeY / HOUR_HEIGHT_PX; // hours from GRID_START_HOUR
    const newStartMs = day.dayUnix + (GRID_START_HOUR + newStartHourOffset) * 3_600_000;
    const snappedStart = snapTo15Minutes(newStartMs);
    const snappedEnd   = snappedStart + durationMs;

    const eventId = session.event.id;

    // Optimistic local update (immediate visual feedback)
    setEvents(prev => prev.map(ev =>
      ev.id === eventId
        ? { ...ev, startUnix: snappedStart, endUnix: snappedEnd }
        : ev,
    ));

    // Update drag session reference so the next dragover delta is correct
    dragRef.current = {
      ...session,
      event:           { ...session.event, startUnix: snappedStart, endUnix: snappedEnd },
      dayMidnightUnix: day.dayUnix,
    };

    // Debounce the API PATCH — fire once the user settles on a position
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch('/api/google-calendar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, startUnix: snappedStart, endUnix: snappedEnd }),
      }).catch(err => console.error('[calendar drag PATCH]', err));
    }, DEBOUNCE_MS);
  }, []);

  const handleDrop    = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDraggingId(null);
    dragRef.current = null;
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    dragRef.current = null;
  }, []);

  return (
    <section className="flex flex-col gap-3 overflow-x-auto px-6 py-2">
      <CalendarControls
        weekStart={weekStart}
        onPrevWeek={prevWeek}
        onNextWeek={nextWeek}
        onGoToToday={goToToday}
      />

      {/* Connected = null → loading skeleton */}
      {connected === null && (
        <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-[#1a1d24] bg-[#0d0e12]">
          <span className="text-xs text-[#3a4050] animate-pulse">Loading calendar…</span>
        </div>
      )}

      {/* Not connected → show OAuth prompt */}
      {connected === false && (
        <Suspense>
          <ConnectCalendarBanner />
        </Suspense>
      )}

      {/* Connected → show the full grid */}
      {connected === true && (
        <CalendarGrid
          weekStart={weekStart}
          events={events}
          currentTimePx={currentTimePx}
          todayMidnight={todayMidnight}
          draggingId={draggingId}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      )}
    </section>
  );
}
