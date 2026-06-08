import {
  taskColumnConfig,
  type TaskPriority,
  type TaskStatus,
} from "@/components/tasks/task-types";

export function formatOption(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDueDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDueDateShort(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export const priorityStyles: Record<TaskPriority, string> = {
  low: "border-teal-500/30 bg-teal-500/15 text-teal-300",
  normal: "border-sky-500/30 bg-sky-500/15 text-sky-300",
  medium: "border-sky-500/30 bg-sky-500/15 text-sky-300",
  high: "border-amber-500/30 bg-amber-500/15 text-amber-200",
  urgent: "border-rose-500/30 bg-rose-500/15 text-rose-300",
};

export function getStatusLabel(status: TaskStatus, blocked: boolean) {
  if (blocked) return "Off track";
  if (status === "done") return "Complete";
  if (status === "review") return "At risk";
  if (status === "doing") return "On track";
  return "Not started";
}

export function getStatusStyle(status: TaskStatus, blocked: boolean) {
  if (blocked) return "border-rose-500/30 bg-rose-500/15 text-rose-300";
  if (status === "done") return "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
  if (status === "review") return "border-amber-500/30 bg-amber-500/15 text-amber-200";
  if (status === "doing") return "border-teal-500/30 bg-teal-500/15 text-teal-300";
  return "border-slate-500/30 bg-slate-500/15 text-slate-300";
}

export function getSectionLabel(status: TaskStatus) {
  return taskColumnConfig[status].label;
}
