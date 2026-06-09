"use client";

import { clientApi, TASKS_API_BASE } from "@/app/lib/client-api";
import { readStoredTasks } from "@/components/tasks/task-storage";
import { computePulseMetrics } from "@/components/analytics/analytics-pulse-utils";
import type { TaskListItem } from "@/components/tasks/task-types";
import type { AnalyticsWeekly } from "@/lib/analytics/types";
import {
  mapApiTaskToListItem,
  type ApiTaskListItem,
} from "@/lib/tasks/map-api-task";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  GitPullRequest,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnalyticsSectionHeader } from "@/components/analytics/analytics-section-header";

export function AnalyticsPulseOverview() {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [weekly, setWeekly] = useState<AnalyticsWeekly | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      let nextTasks: TaskListItem[] = [];
      let nextWeekly: AnalyticsWeekly | null = null;
      let tasksFailed = false;

      try {
        const { data } = await clientApi.get<{ tasks: ApiTaskListItem[] }>(
          TASKS_API_BASE,
        );
        nextTasks = data.tasks.map(mapApiTaskToListItem);
      } catch {
        tasksFailed = true;
        nextTasks = readStoredTasks() ?? [];
      }

      try {
        const { data } = await clientApi.get<{ weekly: AnalyticsWeekly }>(
          "/analytics/weekly",
        );
        nextWeekly = data.weekly;
      } catch {
        nextWeekly = null;
      }

      if (cancelled) return;

      setTasks(nextTasks);
      setWeekly(nextWeekly);

      if (tasksFailed && nextTasks.length === 0) {
        setError("Could not load overview. Is the server running?");
      }

      setIsLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(
    () => computePulseMetrics(tasks, weekly),
    [tasks, weekly],
  );

  const activeRatio = metrics.total
    ? Math.round((metrics.activeTasks / metrics.total) * 100)
    : 0;
  const blockedRatio = metrics.total
    ? Math.round((metrics.blockedTasks / metrics.total) * 100)
    : 0;
  const healthyRatio = Math.max(0, 100 - blockedRatio);

  return (
    <section className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <AnalyticsSectionHeader
        icon={<BarChart3 className="size-3.5 text-violet-700 dark:text-violet-400" />}
        title="Overview"
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading overview...</p>
      ) : error ? (
        <p className="text-sm text-rose-400/80">{error}</p>
      ) : (
        <>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <ActivityBar
              label={`${metrics.activeTasks} Active tasks`}
              fillPct={activeRatio}
              fillClass="bg-violet-500/80"
              trackClass="bg-violet-100 dark:bg-violet-500/15"
            />
            <ActivityBar
              label={`${metrics.blockedTasks} Blocked tasks`}
              fillPct={blockedRatio}
              fillClass="bg-rose-500/80"
              trackClass="bg-rose-500/15"
              secondaryPct={healthyRatio}
              secondaryClass="bg-emerald-500/70"
            />
          </div>

          <div className="mt-4 grid divide-y divide-border/50 border-t border-border/50 md:grid-cols-4 md:divide-x md:divide-y-0">
            <OverviewMetric
              icon={<CheckCircle2 className="size-3.5 text-violet-700 dark:text-violet-400/80" />}
              value={metrics.completed}
              label="Completed tasks"
            />
            <OverviewMetric
              icon={<GitPullRequest className="size-3.5 text-emerald-700 dark:text-emerald-400/80" />}
              value={metrics.inProgress}
              label="In progress"
            />
            <OverviewMetric
              icon={<AlertCircle className="size-3.5 text-rose-400/80" />}
              value={metrics.blockedTasks}
              label="Blocked tasks"
            />
            <OverviewMetric
              icon={<Plus className="size-3.5 text-sky-700 dark:text-sky-400/80" />}
              value={metrics.startedThisWeek}
              label="Started this week"
            />
          </div>
        </>
      )}
    </section>
  );
}

function ActivityBar({
  label,
  fillPct,
  fillClass,
  trackClass,
  secondaryPct,
  secondaryClass,
}: {
  label: string;
  fillPct: number;
  fillClass: string;
  trackClass: string;
  secondaryPct?: number;
  secondaryClass?: string;
}) {
  return (
    <div>
      <div className={cn("h-2 overflow-hidden rounded-full", trackClass)}>
        <div className="flex h-full">
          <div
            className={cn("h-full transition-all", fillClass)}
            style={{ width: `${fillPct}%` }}
          />
          {secondaryPct !== undefined && secondaryClass ? (
            <div
              className={cn("h-full transition-all", secondaryClass)}
              style={{ width: `${secondaryPct}%` }}
            />
          ) : null}
        </div>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function OverviewMetric({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="px-3 py-3 md:py-4">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xl font-semibold tabular-nums text-foreground/90">
          {value}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
