import type { AgendaEvent } from "@/lib/home/agenda-types";
import { AGENDA_DAYS_AHEAD } from "@/lib/home/agenda-types";

export function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getUpcomingWeekBounds() {
  const now = new Date();
  const end = new Date();
  end.setDate(end.getDate() + AGENDA_DAYS_AHEAD - 1);
  end.setHours(23, 59, 59, 999);

  return {
    timeMin: now.toISOString(),
    timeMax: end.toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export function enrichAgendaEvent(
  event: Omit<AgendaEvent, "dateKey"> & { dateKey?: string },
): AgendaEvent {
  const startAt = event.startAt;
  const dateKey = event.dateKey ?? getDateKey(new Date(startAt));
  return { ...event, dateKey };
}

export function filterUpcomingEvents(events: AgendaEvent[]) {
  const nowMs = Date.now();
  return events.filter((event) => new Date(event.endAt).getTime() > nowMs);
}

export function getEventsForDate(events: AgendaEvent[], date: Date) {
  const dateKey = getDateKey(date);
  return events.filter((event) => event.dateKey === dateKey);
}

export function groupEventsByDate(events: AgendaEvent[]) {
  const groups = new Map<string, AgendaEvent[]>();

  for (const event of events) {
    const existing = groups.get(event.dateKey) ?? [];
    existing.push(event);
    groups.set(event.dateKey, existing);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([dateKey, dayEvents]) => ({ dateKey, events: dayEvents }));
}

export function formatDayHeading(dateKey: string) {
  const date = parseDateKey(dateKey);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (getDateKey(date) === getDateKey(today)) {
    return "Today";
  }

  if (getDateKey(date) === getDateKey(tomorrow)) {
    return "Tomorrow";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function datesWithEvents(events: AgendaEvent[]) {
  return new Set(events.map((event) => event.dateKey));
}
