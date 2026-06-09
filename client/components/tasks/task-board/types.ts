import type {
  BoardColumnDefinition,
  TaskListItem,
  TaskStatus,
  TaskUpdate,
} from "@/components/tasks/task-types";

export type TaskBoardProps = {
  tasks: TaskListItem[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onAddTask: (status: TaskStatus) => void;
  onUpdateTask: (taskId: string, update: TaskUpdate) => void;
  columns?: BoardColumnDefinition[];
  getTaskColumnKey?: (task: TaskListItem) => string;
};

export type ColumnItems = Record<string, string[]>;

export type BoardColumnProps = {
  column: BoardColumnDefinition;
  tasks: TaskListItem[];
  taskIds: string[];
  selectedTaskId: string | null;
  isBoardDragging?: boolean;
  onSelectTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, update: TaskUpdate) => void;
  onAddTask: (status: TaskStatus) => void;
};

export type SortableTaskCardProps = {
  task: TaskListItem;
  selected: boolean;
  isBoardDragging?: boolean;
  onSelect: (taskId: string) => void;
  onUpdate: (taskId: string, update: TaskUpdate) => void;
};
