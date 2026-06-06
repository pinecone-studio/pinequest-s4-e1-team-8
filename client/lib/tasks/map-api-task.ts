import {
  normalizeTaskStatus,
  type TaskListItem,
  type TaskMember,
  type TaskPriority,
  type TaskSource,
} from "@/components/tasks/task-types";

type ApiTaskMember = string | TaskMember;

export type ApiTaskListItem = {
  id: string;
  source: TaskSource;
  title: string;
  tool: string;
  status: string;
  priority: string;
  blocked: boolean;
  dueDate: string;
  progress: number;
  timeLeft: string;
  doneCount: number;
  blockedCount: number;
  members: ApiTaskMember[];
  team?: string;
};

export function normalizeMembers(members: unknown[] | undefined): TaskMember[] {
  return (members ?? []).flatMap((member) => {
    if (typeof member === "string" && member.trim()) {
      return [{ initials: member }];
    }

    if (member && typeof member === "object" && "initials" in member) {
      const value = member as TaskMember;
      if (typeof value.initials === "string" && value.initials.trim()) {
        return [{ initials: value.initials, avatarUrl: value.avatarUrl }];
      }
    }

    return [];
  });
}

export function normalizeMemberInitials(members: unknown[] | undefined): string[] {
  return normalizeMembers(members).map((member) => member.initials);
}

function normalizePriority(priority: string): TaskPriority {
  if (priority === "low" || priority === "normal" || priority === "medium" || priority === "high" || priority === "urgent") {
    return priority;
  }
  return "medium";
}

export function mapApiTaskToListItem(task: ApiTaskListItem): TaskListItem {
  return {
    id: task.id,
    source: task.source,
    team: task.team ?? task.tool ?? "General",
    title: task.title,
    tool: task.tool,
    status: normalizeTaskStatus(task.status),
    priority: normalizePriority(task.priority),
    blocked: task.blocked,
    dueDate: task.dueDate,
    progress: task.progress,
    timeLeft: task.timeLeft,
    doneCount: task.doneCount,
    blockedCount: task.blockedCount,
    members: normalizeMembers(task.members ?? []),
  };
}
