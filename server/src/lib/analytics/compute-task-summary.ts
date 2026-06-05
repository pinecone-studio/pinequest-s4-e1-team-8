import type { Task } from "../../schema/task.model";
import type { AnalyticsSummary } from "./analytics.types";

const emptySummary = (): AnalyticsSummary => ({
  total: 0,
  blocked: 0,
  avgProgress: 0,
  byStatus: { backlog: 0, todo: 0, in_progress: 0, done: 0 },
  bySource: { github: 0, asana: 0, internal: 0 },
});

export function computeTaskSummary(rows: Task[]): AnalyticsSummary {
  if (rows.length === 0) return emptySummary();

  const summary = emptySummary();
  let progressTotal = 0;

  for (const row of rows) {
    summary.total += 1;
    progressTotal += row.progress ?? 0;

    if (row.blocked) summary.blocked += 1;

    if (row.status === "BACKLOG") summary.byStatus.backlog += 1;
    else if (row.status === "TODO") summary.byStatus.todo += 1;
    else if (row.status === "IN_PROGRESS") summary.byStatus.in_progress += 1;
    else if (row.status === "DONE") summary.byStatus.done += 1;

    if (row.source === "github") summary.bySource.github += 1;
    else if (row.source === "asana") summary.bySource.asana += 1;
    else if (row.source === "internal") summary.bySource.internal += 1;
  }

  summary.avgProgress = Math.round(progressTotal / rows.length);
  return summary;
}
