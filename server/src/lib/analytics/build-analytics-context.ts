import type { Task } from "../../schema/task.model";
import { computeTaskRisks } from "./compute-task-risks";
import { computeTaskSummary } from "./compute-task-summary";
import { computeTaskWeekly } from "./compute-task-weekly";

const PRIORITY_ORDER: Record<string, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export function buildAnalyticsContext(rows: Task[]) {
  const summary = computeTaskSummary(rows);
  const weekly = computeTaskWeekly(rows);
  const risks = computeTaskRisks(rows);

  const activeTasks = rows
    .filter((task) => task.status !== "DONE")
    .sort((a, b) => {
      if (a.blocked !== b.blocked) return a.blocked ? -1 : 1;
      return (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
    })
    .slice(0, 25)
    .map((task) => ({
      title: task.title,
      status: task.status,
      progress: task.progress,
      blocked: task.blocked,
      priority: task.priority,
      dueDate: task.dueDate,
      source: task.source,
    }));

  return { summary, weekly, risks, activeTasks };
}
