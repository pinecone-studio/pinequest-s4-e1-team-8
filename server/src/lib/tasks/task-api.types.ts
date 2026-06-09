import type { TaskSource } from "../../schema/task.model";
import type { TaskMember } from "./task-mapper";

/** Matches client `TaskListItem` in components/tasks/task-row.tsx */
export type TaskListItemDto = {
  id: string;
  source: TaskSource;
  projectId: string;
  parentId: string | null;
  title: string;
  description: string | null;
  tool: string;
  status: string;
  priority: string;
  blocked: boolean;
  dueDate: string;
  progress: number;
  timeLeft: string;
  doneCount: number;
  blockedCount: number;
  members: TaskMember[];
  sequenceOrder: number;
  dependencyTaskIds: string[];
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
  members?: Array<string | TaskMember>;
  workspaceId?: string;
  projectId?: string;
  subTeamId?: string;
  assigneeId?: string;
  description?: string;
};

export type UpdateTaskBody = Partial<CreateTaskBody> & {
  userId?: string;
};
