import type { Task, TaskPriority, TaskSource, TaskStatus } from "../../schema/task.model";
import type { TaskListItemDto } from "./task-api.types";

const STATUS_TO_UI: Record<TaskStatus, string> = {
  BACKLOG: "backlog",
  TODO: "todo",
  IN_PROGRESS: "in progress",
  DONE: "completed",
};

const UI_TO_STATUS: Record<string, TaskStatus> = {
  backlog: "BACKLOG",
  todo: "TODO",
  doing: "IN_PROGRESS",
  "in progress": "IN_PROGRESS",
  completed: "DONE",
  done: "DONE",
};

const PRIORITY_TO_UI: Record<TaskPriority, string> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

const UI_TO_PRIORITY: Record<string, TaskPriority> = {
  low: "LOW",
  medium: "MEDIUM",
  normal: "MEDIUM",
  high: "HIGH",
  urgent: "URGENT",
};

export function parseMembersJson(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((m): m is string => typeof m === "string")
      : [];
  } catch {
    return [];
  }
}

export function serializeMembers(members: string[] | undefined): string {
  return JSON.stringify(members ?? []);
}

export function toTaskListItem(row: Task): TaskListItemDto {
  return {
    id: row.id,
    source: row.source,
    title: row.title,
    tool: row.tool ?? "Internal",
    status: STATUS_TO_UI[row.status] ?? row.status.toLowerCase(),
    priority: PRIORITY_TO_UI[row.priority] ?? row.priority.toLowerCase(),
    blocked: Boolean(row.blocked),
    dueDate: row.dueDate ?? "",
    progress: row.progress ?? 0,
    timeLeft: row.timeLeft ?? "",
    doneCount: row.doneCount ?? 0,
    blockedCount: row.blockedCount ?? 0,
    members: parseMembersJson(row.membersJson),
  };
}

export function uiStatusToDb(status: string | undefined): TaskStatus | undefined {
  if (!status) return undefined;
  return UI_TO_STATUS[status.toLowerCase()];
}

export function uiPriorityToDb(priority: string | undefined): TaskPriority | undefined {
  if (!priority) return undefined;
  return UI_TO_PRIORITY[priority.toLowerCase()];
}

export function isTaskSource(value: string): value is TaskSource {
  return value === "github" || value === "asana" || value === "internal";
}
