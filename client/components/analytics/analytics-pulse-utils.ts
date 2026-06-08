import { getTaskTeam, type TaskListItem } from "@/components/tasks/task-types";
import type { AnalyticsWeekly } from "@/lib/analytics/types";

export type PulsePeriod = "1w" | "2w" | "1m";

export type PulseMetrics = {
  activeTasks: number;
  blockedTasks: number;
  completed: number;
  inProgress: number;
  backlog: number;
  startedThisWeek: number;
  total: number;
  avgProgress: number;
};

export function filterTasksByTeam(
  tasks: TaskListItem[],
  activeTeam: string | null,
): TaskListItem[] {
  if (!activeTeam) return tasks;
  return tasks.filter((task) => getTaskTeam(task) === activeTeam);
}

export function getPulseDateRange(period: PulsePeriod): {
  start: Date;
  end: Date;
  label: string;
} {
  const end = new Date();
  const start = new Date(end);

  if (period === "2w") {
    start.setDate(start.getDate() - 13);
  } else if (period === "1m") {
    start.setDate(start.getDate() - 29);
  } else {
    start.setDate(start.getDate() - 6);
  }

  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return {
    start,
    end,
    label: `${fmt.format(start)} – ${fmt.format(end)}`,
  };
}

export function computePulseMetrics(
  tasks: TaskListItem[],
  weekly: AnalyticsWeekly | null,
): PulseMetrics {
  const activeTasks = tasks.filter(
    (task) => task.status === "doing" || task.status === "review",
  ).length;
  const blockedTasks = tasks.filter((task) => task.blocked).length;
  const completed = tasks.filter((task) => task.status === "done").length;
  const inProgress = activeTasks;
  const backlog = tasks.filter((task) => task.status === "backlog").length;
  const avgProgress = tasks.length
    ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length)
    : 0;

  return {
    activeTasks,
    blockedTasks,
    completed,
    inProgress,
    backlog,
    startedThisWeek: weekly?.totals.started ?? 0,
    total: tasks.length,
    avgProgress,
  };
}

export function countContributors(tasks: TaskListItem[]): number {
  const initials = new Set<string>();
  for (const task of tasks) {
    for (const member of task.members) {
      initials.add(member.initials);
    }
  }
  return initials.size;
}

export function buildPulseNarrative(
  metrics: PulseMetrics,
  authorCount: number,
  activeTeam: string | null,
  weekly: AnalyticsWeekly | null,
): string[] {
  const scope = activeTeam ?? "the workspace";
  const started = weekly?.totals.started ?? metrics.startedThisWeek;
  const completed = weekly?.totals.completed ?? metrics.completed;

  return [
    `Across ${scope}, ${authorCount} contributor${authorCount === 1 ? "" : "s"} worked on ${metrics.total} task${metrics.total === 1 ? "" : "s"}, with ${started} started and ${completed} completed this week.`,
    `${metrics.inProgress} task${metrics.inProgress === 1 ? " is" : "s are"} in progress, ${metrics.blockedTasks} blocked, and average progress is at ${metrics.avgProgress}%.`,
  ];
}
