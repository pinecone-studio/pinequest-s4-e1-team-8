import type { TaskListItem, TaskSource, TaskStatus } from "@/components/tasks/task-types";

export function createTask(
  source: TaskSource,
  index: number,
  team = "General Team",
  status: TaskStatus = "backlog",
): TaskListItem {
  return {
    id: `${source}-new-${Date.now()}`,
    source,
    parentId: null,
    team,
    title: `New Task ${index}`,
    tool: "Manual",
    status,
    priority: "normal",
    blocked: false,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 0,
    timeLeft: "1 Week Left",
    doneCount: 0,
    blockedCount: 0,
    members: [{ initials: "ME" }],
    description: "",
  };
}
