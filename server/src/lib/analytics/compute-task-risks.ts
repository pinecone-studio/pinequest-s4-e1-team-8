import type { Task } from "../../schema/task.model";
import type { AnalyticsRiskItem, AnalyticsRisks, RiskLevel } from "./analytics-risks.types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDueDate(value: string | null): Date | null {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysUntil(dueDate: Date, now: Date): number {
  return Math.ceil((dueDate.getTime() - now.getTime()) / MS_PER_DAY);
}

function taskTeam(task: Task): string {
  return task.tool?.trim() || "General";
}

function riskRank(level: RiskLevel): number {
  if (level === "high") return 0;
  if (level === "medium") return 1;
  return 2;
}

function classifyTask(task: Task, now: Date): AnalyticsRiskItem | null {
  if (task.status === "DONE") return null;

  const dueDate = parseDueDate(task.dueDate);
  const daysLeft = dueDate ? daysUntil(dueDate, now) : null;
  const dueThisWeek = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  const overdue = daysLeft !== null && daysLeft < 0;

  if (task.blocked) {
    return {
      id: task.id,
      title: task.title,
      team: taskTeam(task),
      reason: overdue
        ? "Blocked · overdue"
        : daysLeft !== null
          ? `Blocked · due in ${daysLeft}d`
          : "Blocked",
      level: "high",
    };
  }

  if (task.priority === "URGENT") {
    return {
      id: task.id,
      title: task.title,
      team: taskTeam(task),
      reason:
        task.progress < 50
          ? `Urgent · ${task.progress}% progress`
          : "Urgent priority",
      level: task.progress < 50 ? "high" : "medium",
    };
  }

  if (overdue) {
    return {
      id: task.id,
      title: task.title,
      team: taskTeam(task),
      reason: "Overdue",
      level: "high",
    };
  }

  if (task.priority === "HIGH" && dueThisWeek) {
    return {
      id: task.id,
      title: task.title,
      team: taskTeam(task),
      reason: `High priority · due in ${daysLeft}d`,
      level: "medium",
    };
  }

  if (dueThisWeek && task.progress < 50) {
    return {
      id: task.id,
      title: task.title,
      team: taskTeam(task),
      reason: `Due in ${daysLeft}d · ${task.progress}% progress`,
      level: "low",
    };
  }

  if (task.progress < 30 && task.status === "IN_PROGRESS") {
    return {
      id: task.id,
      title: task.title,
      team: taskTeam(task),
      reason: `In progress · ${task.progress}% complete`,
      level: "low",
    };
  }

  return null;
}

export function computeTaskRisks(rows: Task[], now = new Date()): AnalyticsRisks {
  const active = rows.filter((row) => row.status !== "DONE");
  const items = active
    .map((task) => classifyTask(task, now))
    .filter((item): item is AnalyticsRiskItem => item !== null)
    .sort((a, b) => riskRank(a.level) - riskRank(b.level));

  let dueThisWeek = 0;
  let urgent = 0;

  for (const task of active) {
    if (task.priority === "URGENT" || task.priority === "HIGH") {
      urgent += 1;
    }

    const dueDate = parseDueDate(task.dueDate);
    if (!dueDate) continue;

    const daysLeft = daysUntil(dueDate, now);
    if (daysLeft >= 0 && daysLeft <= 7) {
      dueThisWeek += 1;
    }
  }

  return {
    blocked: active.filter((task) => task.blocked).length,
    dueThisWeek,
    urgent,
    items,
  };
}
