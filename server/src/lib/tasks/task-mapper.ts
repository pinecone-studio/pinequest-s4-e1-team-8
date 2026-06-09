import type { Task, TaskPriority, TaskSource, TaskStatus } from "../../schema/task.model";
import type { TaskListItemDto } from "./task-api.types";

const STATUS_TO_UI: Record<TaskStatus, string> = {
  BACKLOG: "backlog",
  TODO: "review",
  IN_PROGRESS: "doing",
  DONE: "done",
};

const UI_TO_STATUS: Record<string, TaskStatus> = {
  backlog: "BACKLOG",
  todo: "BACKLOG",
  doing: "IN_PROGRESS",
  review: "TODO",
  "in progress": "TODO",
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

export type TaskMember = {
  initials: string;
  avatarUrl?: string;
};

function normalizeMember(value: unknown): TaskMember | null {
  if (typeof value === "string" && value.trim()) {
    return { initials: value };
  }

  if (value && typeof value === "object") {
    const member = value as { initials?: string; avatarUrl?: string };
    if (member.initials?.trim()) {
      return { initials: member.initials, avatarUrl: member.avatarUrl };
    }
  }

  return null;
}

export function parseMembersJson(value: string | null | undefined): TaskMember[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeMember)
      .filter((member): member is TaskMember => member !== null);
  } catch {
    return [];
  }
}

export function serializeMembers(
  members: Array<string | TaskMember> | undefined,
): string {
  const normalized = (members ?? []).map((member) =>
    typeof member === "string" ? { initials: member } : member,
  );
  return JSON.stringify(normalized);
}

export function toTaskListItem(row: Task): TaskListItemDto {
  return {
    id: row.id,
    source: row.source,
    projectId: row.projectId,
    parentId: row.parentId ?? null,
    title: row.title,
    description: row.description ?? null,
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
