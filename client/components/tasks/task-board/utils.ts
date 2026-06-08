import { taskStatuses, type TaskListItem, type TaskStatus } from "@/components/tasks/task-types";
import type { UniqueIdentifier } from "@dnd-kit/core";
import type { ColumnItems } from "./types";

export function buildColumnItems(tasks: TaskListItem[]): ColumnItems {
  return taskStatuses.reduce((groups, status) => {
    groups[status] = tasks
      .filter((task) => task.status === status)
      .map((task) => task.id);
    return groups;
  }, {} as ColumnItems);
}

export function findContainer(
  items: ColumnItems,
  id: UniqueIdentifier,
): TaskStatus | null {
  if (taskStatuses.includes(id as TaskStatus)) {
    return id as TaskStatus;
  }

  return (
    taskStatuses.find((status) => items[status].includes(String(id))) ?? null
  );
}

export function resolveOverContainer(
  items: ColumnItems,
  overId: UniqueIdentifier,
): TaskStatus | null {
  const overItemId = String(overId);

  return (
    findContainer(items, overId) ??
    (taskStatuses.includes(overItemId as TaskStatus)
      ? (overItemId as TaskStatus)
      : null)
  );
}
