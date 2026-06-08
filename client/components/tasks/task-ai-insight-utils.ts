"use client";

import type { TaskListItem, TaskStatus } from "@/components/tasks/task-types";

const columnFallbackInsight: Record<TaskStatus, string> = {
  backlog: "Triage backlog items by due date and priority before moving work forward.",
  doing: "Keep active work limited — finish or unblock items before pulling more in.",
  review: "Review items close to due date first to avoid last-minute delays.",
  done: "Recent completions are on track. Carry momentum into the next sprint.",
};

function isOverdue(dueDate: string) {
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

export function getColumnAiInsight(
  tasks: TaskListItem[],
  status: TaskStatus,
): string {
  if (tasks.length === 0) {
    return columnFallbackInsight[status];
  }

  const blocked = tasks.find((task) => task.blocked);
  if (blocked) {
    return `${blocked.title} is blocked — resolve this before adding more work to ${status}.`;
  }

  const overdue = tasks.find((task) => isOverdue(task.dueDate));
  if (overdue) {
    return `${overdue.title} is overdue. Consider moving it up or re-scoping the deadline.`;
  }

  const urgent = tasks.find(
    (task) => task.priority === "urgent" || task.priority === "high",
  );
  if (urgent && urgent.progress < 50) {
    return `${urgent.title} is high priority at ${urgent.progress}% — focus here next.`;
  }

  const lowProgress = tasks.find((task) => task.progress < 30);
  if (lowProgress && status === "doing") {
    return `${lowProgress.title} is still early (${lowProgress.progress}%). Check for hidden blockers.`;
  }

  return columnFallbackInsight[status];
}
