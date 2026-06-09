import type { TaskListItemDto } from "./task-api.types";

export const reprioritizeUiPriorities = ["Low", "Medium", "High"] as const;
export type ReprioritizeUiPriority = (typeof reprioritizeUiPriorities)[number];

export type ReprioritizeTaskUpdate = {
  taskId: string;
  priority: ReprioritizeUiPriority;
  sequenceOrder: number;
  dependencyTaskIds: string[];
};

export type ReprioritizeTasksBody = {
  projectId: string;
  updates: ReprioritizeTaskUpdate[];
};

export type ReprioritizeValidationResult =
  | { ok: true; data: ReprioritizeTasksBody }
  | { ok: false; error: string };

export type ReorderedTaskDto = TaskListItemDto & {
  sequenceOrder: number;
  dependencyTaskIds: string[];
};
