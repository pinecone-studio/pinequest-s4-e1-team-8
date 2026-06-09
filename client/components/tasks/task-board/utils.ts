import {
  taskColumnConfig,
  taskStatuses,
  type BoardColumnDefinition,
  type TaskListItem,
  type TaskStatus,
} from "@/components/tasks/task-types";
import type { UniqueIdentifier } from "@dnd-kit/core";
import type { ColumnItems } from "./types";

export const defaultBoardColumns: BoardColumnDefinition[] = taskStatuses.map(
  (status) => ({
    id: status,
    label: taskColumnConfig[status].label,
    headerClassName: taskColumnConfig[status].headerClassName,
  }),
);

export function buildColumnItems(
  tasks: TaskListItem[],
  columns: BoardColumnDefinition[],
  getTaskColumnKey: (task: TaskListItem) => string,
): ColumnItems {
  return columns.reduce((groups, column) => {
    groups[column.id] = tasks
      .filter((task) => getTaskColumnKey(task) === column.id)
      .map((task) => task.id);
    return groups;
  }, {} as ColumnItems);
}

export function findContainer(
  items: ColumnItems,
  columnIds: string[],
  id: UniqueIdentifier,
): string | null {
  const itemId = String(id);

  if (columnIds.includes(itemId)) {
    return itemId;
  }

  return columnIds.find((columnId) => items[columnId]?.includes(itemId)) ?? null;
}

export function resolveOverContainer(
  items: ColumnItems,
  columnIds: string[],
  overId: UniqueIdentifier,
): string | null {
  const overItemId = String(overId);

  return (
    findContainer(items, columnIds, overId) ??
    (columnIds.includes(overItemId) ? overItemId : null)
  );
}

export function mapBoardColumnToTaskStatus(columnId: string): TaskStatus {
  const lower = columnId.toLowerCase();

  if (lower.includes("backlog") || lower === "todo") return "backlog";
  if (lower.includes("progress") || lower === "doing") return "doing";
  if (lower.includes("review")) return "review";
  if (lower.includes("launch") || lower.includes("done") || lower.includes("complete")) {
    return "done";
  }

  return "backlog";
}
