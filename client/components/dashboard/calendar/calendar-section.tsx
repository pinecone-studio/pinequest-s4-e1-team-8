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
import { CalendarLoadingGrid } from "./calendar-loading-grid";
import { CalendarFrame } from "./calendar-frame";
import { CalendarResizableShell } from "./calendar-resizable-shell";
import { CalendarViewportProvider } from "./calendar-viewport-context";
import { ConnectCalendarBanner } from "./connect-calendar";
import { EventEditPopover } from "./event-edit-popover";
import { CreateEventPopover } from "./create-event-popover";
import {
  CALENDAR_MIN_WIDTH,
  CALENDAR_SHELL_HEIGHT_PX,
} from "@/lib/dashboard/calendar-layout";

const DEBOUNCE_MS   = 500;
const POLL_INTERVAL = 30_000; // 30 s

interface EditingState  { event: CalendarEvent; pos: { x: number; y: number } }
interface CreatingState { startUnix: number;    pos: { x: number; y: number } }

function CalendarMountPlaceholder() {
  return (
    <div
      className="flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-popover"
      style={{ minWidth: CALENDAR_MIN_WIDTH, height: CALENDAR_SHELL_HEIGHT_PX }}
      aria-hidden
    >
      <div className="flex flex-1 animate-pulse flex-col gap-3 p-4">
        <div className="h-10 rounded-lg bg-muted/40" />
        <div className="h-6 rounded-lg bg-muted/30" />
        <div className="flex-1 rounded-lg bg-muted/20" />
      </div>
    </div>
  );
}

export function CalendarSection() {
  const [calendarReady, setCalendarReady] = useState(false);
  const [todayMidnight, setTodayMidnight] = useState(() => getTodayMidnight());

  useEffect(() => {
    setTodayMidnight(getTodayMidnight());
    setCalendarReady(true);
  }, []);

  // ─── Week ─────────────────────────────────────────────────────────────────
  const [weekStart, setWeekStart] = useState(() => getWeekStart(Date.now()));
  const prevWeek  = useCallback(() => setWeekStart(w => w - 7 * 86_400_000), []);
  const nextWeek  = useCallback(() => setWeekStart(w => w + 7 * 86_400_000), []);
  const goToToday = useCallback(() => setWeekStart(getWeekStart(Date.now())), []);

  // ─── Events + connection ──────────────────────────────────────────────────
  const [events,    setEvents]    = useState<CalendarEvent[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Ref so the polling closure always sees the current drag state
  const isDraggingRef = useRef(false);

  // Core fetch — silent=false shows the loading skeleton (initial/week-change)
  //              silent=true  keeps existing events visible while re-fetching
  const fetchEvents = useCallback(async (wStart: number, silent: boolean) => {
    if (!silent) setConnected(null);
    setIsSyncing(true);
    try {
      const res  = await fetch(`/api/google-calendar?weekStart=${wStart}`);
      if (!res.ok) return;
      const data = (await res.json()) as { connected?: boolean; events?: CalendarEvent[] };
      if (data.connected === false) {
        setConnected(false);
        setEvents([]);
      } else {
        setConnected(true);
        setEvents(data.events ?? []);
        setLastSynced(new Date());
      }
    } catch {
      // keep existing state on network error
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial load + week-change (full skeleton)
  useEffect(() => {
    fetchEvents(weekStart, false);
  }, [weekStart, fetchEvents]);

  // Background polling
  useEffect(() => {
    const poll = () => {
      if (document.visibilityState === 'hidden') return;
      if (isDraggingRef.current) return;
      fetchEvents(weekStart, true);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchEvents(weekStart, true);
    };

    const id = setInterval(poll, POLL_INTERVAL);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [weekStart, fetchEvents]);

  // Manual refresh (from controls bar)
  const handleRefresh = useCallback(() => {
    fetchEvents(weekStart, true);
  }, [weekStart, fetchEvents]);

  // ─── Current time ─────────────────────────────────────────────────────────
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

  // ─── Drag-and-drop ────────────────────────────────────────────────────────
  const [draggingId, setDraggingId] = useState<string | null>(null);

  interface DragSession {
    event: CalendarEvent; offsetY: number;
    dayMidnightUnix: number; colRect: DOMRect | null;
  }
  const dragRef     = useRef<DragSession | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDragStart = useCallback((
    e: React.DragEvent, event: CalendarEvent, dayMidnight: number,
  ) => {
    isDraggingRef.current = true;
    setDraggingId(event.id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragRef.current = { event, offsetY: e.clientY - rect.top, dayMidnightUnix: dayMidnight, colRect: null };
    const ghost = document.createElement('div');
    ghost.style.cssText = 'position:fixed;top:-9999px;opacity:0;';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    requestAnimationFrame(() => document.body.removeChild(ghost));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, day: WeekDay) => {
    e.preventDefault();
    const session = dragRef.current;
    if (!session) return;
    const rect       = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relativeY  = e.clientY - rect.top - session.offsetY;
    const durationMs = session.event.endUnix - session.event.startUnix;
    const newStartMs = day.dayUnix + (GRID_START_HOUR + relativeY / HOUR_HEIGHT_PX) * 3_600_000;
    const snappedStart = snapTo15Minutes(newStartMs);
    const snappedEnd   = snappedStart + durationMs;
    const eventId = session.event.id;
    setEvents(prev => prev.map(ev =>
      ev.id === eventId ? { ...ev, startUnix: snappedStart, endUnix: snappedEnd } : ev,
    ));
    dragRef.current = {
      ...session,
      event: { ...session.event, startUnix: snappedStart, endUnix: snappedEnd },
      dayMidnightUnix: day.dayUnix,
    };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch('/api/google-calendar', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, startUnix: snappedStart, endUnix: snappedEnd }),
      }).catch(err => console.error('[calendar drag PATCH]', err));
    }, DEBOUNCE_MS);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    isDraggingRef.current = false;
    setDraggingId(null);
    dragRef.current = null;
  }, []);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    setDraggingId(null);
    dragRef.current = null;
  }, []);

  // ─── Edit event ───────────────────────────────────────────────────────────
  const [editing, setEditing] = useState<EditingState | null>(null);

  const handleOpenEdit = useCallback((e: React.MouseEvent, event: CalendarEvent) => {
    setCreating(null);
    setEditing({ event, pos: { x: e.clientX, y: e.clientY } });
  }, []);

  const handleSaveEdit = useCallback(async (
    eventId: string,
    patch: { title?: string; startUnix?: number; endUnix?: number; addMeet?: boolean },
  ) => {
    setEditing(null);
    if (patch.title !== undefined || patch.startUnix !== undefined || patch.endUnix !== undefined) {
      setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, ...patch } : ev));
    }
    try {
      const res = await fetch('/api/google-calendar', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, ...patch }),
      });
      if (res.ok) {
        const data = (await res.json()) as { ok: boolean; event?: CalendarEvent };
        if (data.event) setEvents(prev => prev.map(ev => ev.id === eventId ? { ...data.event! } : ev));
      }
    } catch (err) { console.error('[calendar save edit]', err); }
  }, []);

  const handleDelete = useCallback(async (eventId: string) => {
    setEditing(null);
    setEvents(prev => prev.filter(ev => ev.id !== eventId));
    try {
      await fetch('/api/google-calendar', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
    } catch (err) { console.error('[calendar delete]', err); }
  }, []);

  // ─── Create event ─────────────────────────────────────────────────────────
  const [creating, setCreating] = useState<CreatingState | null>(null);

  const handleOpenCreate = useCallback((_dayUnix: number, startUnix: number, e: React.MouseEvent) => {
    setEditing(null);
    setCreating({ startUnix, pos: { x: e.clientX, y: e.clientY } });
  }, []);

  const handleNewEventButton = useCallback((e: React.MouseEvent) => {
    setEditing(null);
    setCreating({ startUnix: snapTo15Minutes(Date.now()), pos: { x: e.clientX, y: e.clientY } });
  }, []);

  const handleCreateEvent = useCallback(async (data: {
    title: string; startUnix: number; endUnix: number; addMeet: boolean;
  }) => {
    setCreating(null);
    try {
      const res = await fetch('/api/google-calendar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = (await res.json()) as { ok: boolean; event?: CalendarEvent };
        if (result.event) {
          const weekEnd = weekStart + 7 * 86_400_000;
          if (result.event.startUnix >= weekStart && result.event.startUnix < weekEnd) {
            setEvents(prev => [...prev, result.event!]);
          }
        }
      }
    } catch (err) { console.error('[calendar create]', err); }
  }, [weekStart]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <CalendarViewportProvider>
      <section className="flex flex-col gap-3 overflow-x-auto px-6 py-2">
        <CalendarControls
          weekStart={weekStart}
          onPrevWeek={prevWeek}
          onNextWeek={nextWeek}
          onGoToToday={goToToday}
          onNewEvent={handleNewEventButton}
          isSyncing={isSyncing}
          lastSynced={lastSynced}
          onRefresh={handleRefresh}
        />

        <CalendarResizableShell>
          {!calendarReady ? (
            <CalendarMountPlaceholder />
          ) : connected === null ? (
            <CalendarLoadingGrid
              weekStart={weekStart}
              todayMidnight={todayMidnight}
            />
          ) : connected === false ? (
            <CalendarFrame weekStart={weekStart} todayMidnight={todayMidnight}>
              <div className="flex h-full min-h-full items-center justify-center px-8 py-12">
                <Suspense>
                  <ConnectCalendarBanner />
                </Suspense>
              </div>
            </CalendarFrame>
          ) : (
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
              onEdit={handleOpenEdit}
              onCreateSlot={handleOpenCreate}
            />
          )}
        </CalendarResizableShell>

      {editing && (
        <EventEditPopover
          event={editing.event}
          pos={editing.pos}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
          onClose={() => setEditing(null)}
        />
      )}

      {creating && (
        <CreateEventPopover
          startUnix={creating.startUnix}
          pos={creating.pos}
          onCreate={handleCreateEvent}
          onClose={() => setCreating(null)}
        />
      )}
      </section>
    </CalendarViewportProvider>
  );
}
