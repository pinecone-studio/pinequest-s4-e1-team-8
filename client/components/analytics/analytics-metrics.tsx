"use client";

import { AnalyticsBarChart, type ChartBarItem } from "@/components/analytics/analytics-bar-chart";
import { mockTasks } from "@/components/tasks/mock-tasks";
import { readStoredTasks } from "@/components/tasks/task-storage";
import type { TaskListItem, TaskSource } from "@/components/tasks/task-types";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function computeMetrics(tasks: TaskListItem[]) {
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === "done").length;
  const blocked = tasks.filter((task) => task.blocked).length;
  const progress =
    total > 0
      ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / total)
      : 0;

  const byStatus: ChartBarItem[] = [
    {
      label: "Todo",
      value: tasks.filter((task) => task.status === "backlog").length,
      gradient: "from-slate-600 to-slate-500/70",
      glow: "shadow-slate-500/20",
    },
    {
      label: "Doing",
      value: tasks.filter(
        (task) => task.status === "doing" || task.status === "review",
      ).length,
      gradient: "from-violet-600 to-violet-400",
      glow: "shadow-violet-500/35",
    },
    {
      label: "Done",
      value: done,
      gradient: "from-emerald-600 to-emerald-400",
      glow: "shadow-emerald-500/35",
    },
  ];

  const sourceMap: {
    source: TaskSource;
    label: string;
    gradient: string;
    glow: string;
  }[] = [
    {
      source: "github",
      label: "GH",
      gradient: "from-violet-600 to-violet-400",
      glow: "shadow-violet-500/35",
    },
    {
      source: "asana",
      label: "Asana",
      gradient: "from-sky-500 to-sky-300",
      glow: "shadow-sky-400/35",
    },
    {
      source: "internal",
      label: "Int",
      gradient: "from-amber-500 to-amber-300",
      glow: "shadow-amber-400/35",
    },
  ];

  const bySource: ChartBarItem[] = sourceMap.map(
    ({ source, label, gradient, glow }) => ({
      label,
      value: tasks.filter((task) => task.source === source).length,
      gradient,
      glow,
    }),
  );

  return { total, done, blocked, progress, byStatus, bySource };
}

export function AnalyticsMetrics() {
  const [tasks, setTasks] = useState<TaskListItem[]>(mockTasks);

  useEffect(() => {
    setTasks(readStoredTasks() ?? mockTasks);
  }, []);

  const metrics = useMemo(() => computeMetrics(tasks), [tasks]);

  return (
    <section className="rounded-xl border border-border/60 bg-[#16171b] p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="grid size-6 place-items-center rounded-md bg-violet-500/15">
          <BarChart3 className="size-3.5 text-violet-400" />
        </div>
        <h2 className="text-base font-semibold tracking-tight">Metrics</h2>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryStat label="Total" value={metrics.total} />
        <SummaryStat
          label="Done"
          value={metrics.done}
          valueClassName="text-emerald-400"
        />
        <SummaryStat
          label="Blocked"
          value={metrics.blocked}
          valueClassName="text-rose-400"
        />
        <SummaryStat
          label="Progress"
          value={`${metrics.progress}%`}
          valueClassName="text-sky-400"
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <AnalyticsBarChart title="By status" items={metrics.byStatus} />
        <AnalyticsBarChart title="By source" items={metrics.bySource} />
      </div>
    </section>
  );
}

function SummaryStat({
  label,
  value,
  valueClassName = "text-foreground",
}: {
  label: string;
  value: number | string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-[#1c1d22] px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-xl font-semibold tracking-tight tabular-nums",
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}
