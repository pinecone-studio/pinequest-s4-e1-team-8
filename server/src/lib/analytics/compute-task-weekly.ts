import type { Task } from "../../schema/task.model";
import type { AnalyticsWeekly, WeeklyDay } from "./analytics-weekly.types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildLast7Days(now: Date): WeeklyDay[] {
  const days: WeeklyDay[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setUTCDate(day.getUTCDate() - offset);

    days.push({
      date: toDateKey(day),
      label: DAY_LABELS[day.getUTCDay()],
      completed: 0,
      started: 0,
    });
  }

  return days;
}

export function computeTaskWeekly(rows: Task[], now = new Date()): AnalyticsWeekly {
  const days = buildLast7Days(now);
  const indexByDate = new Map(days.map((day, index) => [day.date, index]));

  for (const row of rows) {
    const createdKey = toDateKey(row.createdAt);
    const createdIndex = indexByDate.get(createdKey);
    if (createdIndex !== undefined) {
      days[createdIndex].started += 1;
    }

    if (row.status === "DONE") {
      const completedKey = toDateKey(row.updatedAt);
      const completedIndex = indexByDate.get(completedKey);
      if (completedIndex !== undefined) {
        days[completedIndex].completed += 1;
      }
    }
  }

  return {
    days,
    totals: {
      completed: days.reduce((sum, day) => sum + day.completed, 0),
      started: days.reduce((sum, day) => sum + day.started, 0),
    },
  };
}
