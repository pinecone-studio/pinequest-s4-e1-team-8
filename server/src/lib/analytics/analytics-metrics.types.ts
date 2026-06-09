import type { TaskStatus } from "../../schema/task.model";
import type { AnalyticsWeekly } from "./analytics-weekly.types";

export type TaskCycleMetric = {
  taskId: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  cycleDays: number | null;
  transitionedToCompleted: boolean;
};

export type CycleMetricsAggregation = {
  completedCycles: TaskCycleMetric[];
  averageCompletionDays: number;
  completionVelocity: number;
  statusDistribution: Record<TaskStatus, number>;
  weeklyTransitions: AnalyticsWeekly;
};

export type SprintCompletionPath = {
  pathId: string;
  milestone: string;
  projectedCompletionDate: string;
  confidence: number;
  steps: string[];
};

export type BottleneckVector = {
  vectorId: string;
  area: string;
  severity: number;
  impact: string;
  mitigation: string;
};

export type AnalyticsMetricsMatrix = {
  sprintCompletionPaths: SprintCompletionPath[];
  bottleneckVectors: BottleneckVector[];
};
