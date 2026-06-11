import type { TimelineItem } from "./timeline-types";

export const DAY_MS = 86_400_000;

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round(
    (startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS,
  );
}

export function parseDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function clampPercent(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export type TimelineRange = {
  start: Date;
  end: Date;
  totalDays: number;
};

export function buildRange(items: TimelineItem[]): TimelineRange {
  const today = startOfDay(new Date());

  if (items.length === 0) {
    const start = addDays(today, -7);
    const end = addDays(today, 30);
    return { start, end, totalDays: Math.max(daysBetween(start, end), 1) };
  }

  let min = items[0].start;
  let max = items[0].end;
  for (const item of items) {
    if (item.start < min) {
      min = item.start;
    }
    if (item.end > max) {
      max = item.end;
    }
  }

  if (today < min) {
    min = today;
  }
  if (today > max) {
    max = today;
  }

  const start = addDays(startOfDay(min), -3);
  const end = addDays(startOfDay(max), 3);
  return { start, end, totalDays: Math.max(daysBetween(start, end), 1) };
}

export function offsetX(range: TimelineRange, date: Date, dayWidth: number): number {
  return daysBetween(range.start, date) * dayWidth;
}

export function barMetrics(
  item: TimelineItem,
  range: TimelineRange,
  dayWidth: number,
): { left: number; width: number } {
  const left = daysBetween(range.start, item.start) * dayWidth;
  const span = Math.max(daysBetween(item.start, item.end), 1);
  return { left, width: span * dayWidth };
}

export type MonthSegment = {
  key: string;
  label: string;
  left: number;
  width: number;
};

export function monthSegments(
  range: TimelineRange,
  dayWidth: number,
): MonthSegment[] {
  const segments: MonthSegment[] = [];
  const rangeEndExclusive = addDays(range.end, 1);
  let cursor = startOfDay(range.start);

  while (cursor < rangeEndExclusive) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const segmentEnd = nextMonth < rangeEndExclusive ? nextMonth : rangeEndExclusive;

    segments.push({
      key: `${monthStart.getFullYear()}-${monthStart.getMonth()}`,
      label: monthStart.toLocaleDateString(undefined, { month: "short" }),
      left: daysBetween(range.start, cursor) * dayWidth,
      width: daysBetween(cursor, segmentEnd) * dayWidth,
    });

    cursor = nextMonth;
  }

  return segments;
}

export type WeekTick = {
  key: string;
  left: number;
  label: string;
};

export function weekTicks(range: TimelineRange, dayWidth: number): WeekTick[] {
  const ticks: WeekTick[] = [];
  for (let day = 0; day <= range.totalDays; day += 7) {
    const date = addDays(range.start, day);
    ticks.push({
      key: `week-${day}`,
      left: day * dayWidth,
      label: String(date.getDate()),
    });
  }
  return ticks;
}
