import type { TaskListItem } from "@/components/tasks/task-types";

export type TimelineView = "daily" | "weekly" | "monthly";

export type TimelineRowColor = {
  solid: string;
  fade: string;
  badge: string;
};

export type TimelineRow = {
  task: TaskListItem;
  startPct: number;
  widthPct: number;
  progress: number;
  label: string;
  color: TimelineRowColor;
};

const palette: TimelineRowColor[] = [
  { solid: "bg-sky-500", fade: "bg-sky-500/20", badge: "border-sky-400/50 text-sky-300" },
  { solid: "bg-lime-500", fade: "bg-lime-500/20", badge: "border-lime-400/50 text-lime-300" },
  { solid: "bg-emerald-500", fade: "bg-emerald-500/20", badge: "border-emerald-400/50 text-emerald-300" },
  { solid: "bg-rose-500", fade: "bg-rose-500/20", badge: "border-rose-400/50 text-rose-300" },
  { solid: "bg-amber-500", fade: "bg-amber-500/20", badge: "border-amber-400/50 text-amber-300" },
  { solid: "bg-violet-500", fade: "bg-violet-500/20", badge: "border-violet-400/50 text-violet-300" },
];

export const timelineHours = [9, 10, 11, 12, 13, 14] as const;

function hashId(id: string): number {
  let hash = 0;
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1000;
  }
  return hash;
}

function timelineLabel(task: TaskListItem): string {
  if (task.status === "done") return "Done";
  if (task.timeLeft?.trim()) return task.timeLeft;
  if (task.status === "review") return "In review";
  if (task.status === "doing") return "In progress";
  return "Scheduled";
}

export function buildTimelineRows(tasks: TaskListItem[]): TimelineRow[] {
  return tasks.map((task, index) => {
    const hash = hashId(task.id);
    const startPct = 4 + (hash % 28);
    const widthPct = Math.min(72, 38 + (task.progress % 25));

    return {
      task,
      startPct,
      widthPct,
      progress: Math.min(Math.max(task.progress, 0), 100),
      label: timelineLabel(task),
      color: palette[index % palette.length],
    };
  });
}

export function formatTimelineDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatHourLabel(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour;
  return `${String(display).padStart(2, "0")}:00 ${period}`;
}
