import type { Task } from "../../schema/task.model";
import type { CycleMetricsAggregation, TaskCycleMetric } from "./analytics-metrics.types";
import { computeTaskWeekly } from "./compute-task-weekly";

const EMPTY_STATUS_DISTRIBUTION = {
  BACKLOG: 0,
  TODO: 0,
  IN_PROGRESS: 0,
  DONE: 0,
} as const;

function buildCompletedCycle(row: Task): TaskCycleMetric {
  const cycleDays = Math.max(
    0,
    Math.round((row.updatedAt.getTime() - row.createdAt.getTime()) / 86400000),
  );

  return {
    taskId: row.id,
    title: row.title,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    cycleDays,
    transitionedToCompleted: true,
  };
}

export function computeCycleMetrics(rows: Task[]): CycleMetricsAggregation {
  const statusDistribution = { ...EMPTY_STATUS_DISTRIBUTION };
  const completedCycles: TaskCycleMetric[] = [];
  let totalCompletionDays = 0;

  for (const row of rows) {
    statusDistribution[row.status] += 1;

    if (row.status === "DONE") {
      const cycle = buildCompletedCycle(row);
      completedCycles.push(cycle);
      totalCompletionDays += cycle.cycleDays ?? 0;
    }
  }

  const weeklyTransitions = computeTaskWeekly(rows);

  return {
    completedCycles,
    averageCompletionDays:
      completedCycles.length > 0
        ? Math.round(totalCompletionDays / completedCycles.length)
        : 0,
    completionVelocity: weeklyTransitions.totals.completed,
    statusDistribution,
    weeklyTransitions,
  };
}
