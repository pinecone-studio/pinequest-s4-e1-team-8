import type { TaskListItem, TaskSource } from "@/components/tasks/task-types";

export function createMockTask(
  source: TaskSource,
  index: number,
  team = "General Team",
): TaskListItem {
  return {
    id: `${source}-new-${Date.now()}`,
    source,
    team,
    title: `New Task ${index}`,
    tool: "Manual",
    status: "backlog",
    priority: "normal",
    blocked: false,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 0,
    timeLeft: "1 Week Left",
    doneCount: 0,
    blockedCount: 0,
    members: ["ME"],
  };
}
