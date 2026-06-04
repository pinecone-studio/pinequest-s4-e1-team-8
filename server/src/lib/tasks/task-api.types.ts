import type { TaskSource } from "../../schema/task.model";

/** Matches client `TaskListItem` in components/tasks/task-row.tsx */
export type TaskListItemDto = {
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
  members: string[];
};

export type CreateTaskBody = {
  title: string;
  tool?: string;
  status?: string;
  priority?: string;
  blocked?: boolean;
  dueDate?: string;
  progress?: number;
  timeLeft?: string;
  doneCount?: number;
  blockedCount?: number;
  members?: string[];
  workspaceId?: string;
  projectId?: string;
  subTeamId?: string;
  assigneeId?: string;
  description?: string;
};

export type UpdateTaskBody = Partial<CreateTaskBody>;
