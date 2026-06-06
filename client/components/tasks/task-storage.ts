import {
  normalizeTaskStatus,
  type TaskListItem,
} from "@/components/tasks/task-types";
import { normalizeMembers } from "@/lib/tasks/map-api-task";

const STORAGE_KEY = "team-project-tasks";

export function readStoredTasks() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    const parsed = value ? (JSON.parse(value) as TaskListItem[]) : null;
    return parsed?.map((task) => ({
      ...task,
      team: task.team ?? task.title,
      status: normalizeTaskStatus(task.status),
      description: task.description ?? "",
      members: normalizeMembers((task.members ?? []) as unknown[]),
    }));
  } catch {
    return null;
  }
}

export function saveStoredTasks(tasks: TaskListItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}
