import type { CalendarEvent } from './calendar-types';

// ─── Grid constants ────────────────────────────────────────────────────────────
// Every vertical measurement derives from HOUR_HEIGHT_PX.
// Change this single value to uniformly rescale the entire grid.
export const HOUR_HEIGHT_PX = 80;        // px per clock-hour
export const GRID_START_HOUR = 0;        // first visible hour (00:00)
export const GRID_END_HOUR = 24;         // last visible hour  (24:00)
export const VISIBLE_HOURS = GRID_END_HOUR - GRID_START_HOUR; // 24
export const TOTAL_GRID_HEIGHT_PX = VISIBLE_HOURS * HOUR_HEIGHT_PX; // 1920 px
export const QUARTER_HEIGHT_PX = HOUR_HEIGHT_PX / 4; // 20 px — 15-min tick spacing
export const MIN_CARD_HEIGHT_PX = 32;    // floor so short events stay readable

// ─── Date helpers ──────────────────────────────────────────────────────────────

export interface WeekDay {
  /** Local midnight for this calendar day (UTC ms timestamp) */
  dayUnix: number;
  /** Zero-padded day-of-month, e.g. "04" */
  label: string;
  /** Three-letter abbrev, Mon – Sun */
  shortDay: string;
  isToday: boolean;
}

const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/**
 * Returns the UTC-ms timestamp for the LOCAL midnight of the Monday that
 * contains `fromUnix`.
 */
export function getWeekStart(fromUnix: number): number {
  const d = new Date(fromUnix);
  const dow = d.getDay(); // 0 = Sun, 1 = Mon … 6 = Sat
  const daysBack = dow === 0 ? 6 : dow - 1;
  const monday = new Date(d);
  monday.setDate(d.getDate() - daysBack);
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

/**
 * Returns 7 WeekDay descriptors for the week starting at `weekStartUnix`.
 * `weekStartUnix` must be a Monday local-midnight value from `getWeekStart`.
 */
export function getWeekDays(weekStartUnix: number, todayMidnight: number): WeekDay[] {
  return Array.from({ length: 7 }, (_, i) => {
    // Adding i full days (86 400 s). DST drift is intentionally ignored
    // for calendar-cell alignment — the worst case is a 1-hour shift on
    // DST boundaries, which is acceptable for a weekly planning view.
    const dayUnix = weekStartUnix + i * 86_400_000;
    const d = new Date(dayUnix);
    return {
      dayUnix,
      label: d.getDate().toString().padStart(2, '0'),
      shortDay: SHORT_DAYS[i],
      isToday: dayUnix === todayMidnight,
    };
  });
}

/** Returns the UTC-ms timestamp for LOCAL midnight of today. */
export function getTodayMidnight(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// ─── Pixel-position math ───────────────────────────────────────────────────────

/**
 * Converts an event's start/end Unix timestamps into CSS pixel coordinates
 * within its day column, where top=0 corresponds to GRID_START_HOUR.
 *
 *   topPx    = (startLocalHour − GRID_START_HOUR)  × HOUR_HEIGHT_PX
 *   heightPx = durationHours                        × HOUR_HEIGHT_PX
 *
 * Both are clamped so a card is never invisible.
 */
function eventToPixels(
  event: CalendarEvent,
  dayMidnightUnix: number,
): { topPx: number; heightPx: number } {
  // How many hours have elapsed since LOCAL midnight?
  const startHourLocal = (event.startUnix - dayMidnightUnix) / 3_600_000;
  const durationHours  = (event.endUnix - event.startUnix)   / 3_600_000;

  const topPx    = (startHourLocal - GRID_START_HOUR) * HOUR_HEIGHT_PX;
  const heightPx = Math.max(durationHours * HOUR_HEIGHT_PX, MIN_CARD_HEIGHT_PX);

  return { topPx, heightPx };
}

/**
 * Snaps a UTC-ms timestamp to the nearest 15-minute boundary.
 * Used to round drag-and-drop landing positions.
 */
export function snapTo15Minutes(unixMs: number): number {
  const interval = 15 * 60 * 1000;
  return Math.round(unixMs / interval) * interval;
}

// ─── Overlap resolution ────────────────────────────────────────────────────────

/**
 * Assigns non-overlapping horizontal lanes to every event in the array.
 *
 * Algorithm — greedy sweep line:
 *   1. Sort events by startUnix.
 *   2. Maintain a list of lane-end times (initially empty).
 *   3. For each event, find the first lane whose end ≤ event.startUnix.
 *      If none exists, open a new lane.
 *   4. After all assignments, set widthPct = 100/totalLanes and
 *      leftPct = laneIndex × widthPct.
 *
 * Result: overlapping events tile side-by-side without overflowing the column.
 */
function resolveOverlaps(events: CalendarEvent[]): CalendarEvent[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort((a, b) => a.startUnix - b.startUnix);
  const laneEnd: number[] = [];
  const laneOf: number[]  = [];

  for (const ev of sorted) {
    const freeLane = laneEnd.findIndex(end => end <= ev.startUnix);
    const lane     = freeLane === -1 ? laneEnd.length : freeLane;
    if (freeLane === -1) laneEnd.push(ev.endUnix);
    else                 laneEnd[lane] = ev.endUnix;
    laneOf.push(lane);
  }

  const total = laneEnd.length;
  return sorted.map((ev, i) => ({
    ...ev,
    _layout: {
      ...ev._layout!,
      widthPct: (1 / total) * 100,
      leftPct:  (laneOf[i] / total) * 100,
    },
  }));
}

// ─── Public layout pipeline ────────────────────────────────────────────────────

/**
 * Full layout pipeline for one day column:
 *   1. Strip all-day events (handled separately).
 *   2. Compute vertical pixel positions.
 *   3. Remove events completely outside the visible window.
 *   4. Resolve horizontal overlaps.
 *
 * Returns a new array; original event objects are not mutated.
 */
export function layoutEventsForDay(
  events: CalendarEvent[],
  dayMidnightUnix: number,
): CalendarEvent[] {
  const timed = events.filter(e => e.type !== 'all-day');

  const positioned = timed.map(ev => {
    const { topPx, heightPx } = eventToPixels(ev, dayMidnightUnix);
    return { ...ev, _layout: { topPx, heightPx, leftPct: 0, widthPct: 100 } };
  });

  // Keep only events that are at least partially inside the visible window
  const visible = positioned.filter(
    ev => ev._layout!.topPx < TOTAL_GRID_HEIGHT_PX && ev._layout!.topPx + ev._layout!.heightPx > 0,
  );

  return resolveOverlaps(visible);
}

/**
 * Returns one time-label descriptor per hour in the visible window.
 * The `topPx` value is the distance from the TOP of the column where the
 * label should be anchored (aligned with its hour's grid line).
 */
export function getTimeLabels(): Array<{ hour: number; label: string; topPx: number }> {
  return Array.from({ length: VISIBLE_HOURS + 1 }, (_, i) => {
    const hour = GRID_START_HOUR + i;
    return {
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
      topPx: i * HOUR_HEIGHT_PX,
    };
  });
}
