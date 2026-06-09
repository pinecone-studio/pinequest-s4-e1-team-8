"use client";

import { AnalyticsBarChart, type ChartBarItem } from "@/components/analytics/analytics-bar-chart";
import { clientApi } from "@/app/lib/client-api";
import {
  buildTimelineRows,
  formatHourLabel,
  formatTimelineDate,
  timelineHours,
  type TimelineView,
} from "@/components/analytics/analytics-timeline-utils";
import { memberColors } from "@/components/tasks/task-team-utils";
import { getTaskTeam, type TaskListItem } from "@/components/tasks/task-types";
import type { AnalyticsWeekly } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

const viewTabs: { id: TimelineView; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

type AnalyticsTeamTimelineProps = {
  teamName: string;
  tasks: TaskListItem[];
  summaryOverlay?: ReactNode;
};

export function AnalyticsTeamTimeline({
  teamName,
  tasks,
  summaryOverlay,
}: AnalyticsTeamTimelineProps) {
  const [view, setView] = useState<TimelineView>("daily");
  const [weekly, setWeekly] = useState<AnalyticsWeekly | null>(null);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);

  const teamTasks = useMemo(
    () => tasks.filter((task) => getTaskTeam(task) === teamName),
    [tasks, teamName],
  );

  const timelineRows = useMemo(
    () => buildTimelineRows(teamTasks),
    [teamTasks],
  );

  useEffect(() => {
    if (view !== "weekly") return;

    let cancelled = false;
    setIsLoadingWeekly(true);

    clientApi
      .get<{ weekly: AnalyticsWeekly }>(
        `/analytics/weekly?team=${encodeURIComponent(teamName)}`,
      )
      .then((response) => {
        if (!cancelled) setWeekly(response.data.weekly);
      })
      .catch(() => {
        if (!cancelled) setWeekly(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingWeekly(false);
      });

    return () => {
      cancelled = true;
    };
  }, [view, teamName]);

  const weeklyChartItems = useMemo<ChartBarItem[]>(() => {
    if (!weekly) return [];

    return weekly.days.map((day) => ({
      label: day.label,
      value: day.completed,
      gradient: "from-violet-600/80 to-violet-400/80",
      glow: "shadow-violet-500/25",
    }));
  }, [weekly]);

  return (
    <section className="flex h-full min-h-[400px] flex-col rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex items-center border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-sky-700 dark:text-sky-400/80" />
          <p className="text-sm font-medium text-foreground/90">
            {formatTimelineDate(new Date())}
          </p>
        </div>

        <div className="ml-auto mr-2 flex items-center gap-3">
          {viewTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={cn(
                "border-b-2 pb-1 text-xs font-medium transition-colors",
                view === tab.id
                  ? "border-sky-400 text-sky-800 dark:text-sky-300"
                  : "border-transparent text-muted-foreground hover:text-foreground/80",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {teamName} · {teamTasks.length} task{teamTasks.length === 1 ? "" : "s"}
      </p>

      <div className="mt-2 flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {teamTasks.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No tasks found for this team.
            </p>
          ) : view === "daily" ? (
            <DailyTimeline rows={timelineRows} />
          ) : view === "weekly" ? (
            <div className="mt-2">
              {isLoadingWeekly || !weekly ? (
                <p className="text-sm text-muted-foreground">
                  Loading weekly view...
                </p>
              ) : (
                <AnalyticsBarChart
                  title="Completed per day"
                  items={weeklyChartItems}
                  columns={weekly.days.length}
                />
              )}
            </div>
          ) : (
            <MonthlyProgress rows={timelineRows} />
          )}
        </div>

        {summaryOverlay ? (
          <div className="shrink-0 border-t border-border/40 pt-2">
            {summaryOverlay}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function DailyTimeline({
  rows,
}: {
  rows: ReturnType<typeof buildTimelineRows>;
}) {
  return (
    <div className="mt-4 overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[148px_1fr] gap-3">
          <div />
          <div className="grid grid-cols-6 border-b border-border/40 pb-2">
            {timelineHours.map((hour) => (
              <span
                key={hour}
                className="text-center text-[10px] font-medium text-muted-foreground"
              >
                {formatHourLabel(hour)}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {rows.map((row) => (
            <div
              key={row.task.id}
              className="grid grid-cols-[148px_1fr] items-center gap-3"
            >
              <p className="truncate text-xs font-medium text-foreground/85">
                {row.task.title}
              </p>

              <div className="relative h-10">
                <div className="absolute inset-0 grid grid-cols-6">
                  {timelineHours.map((hour) => (
                    <div
                      key={hour}
                      className="border-l border-border/25 first:border-l-0"
                    />
                  ))}
                </div>

                <div
                  className="absolute top-1/2 flex h-8 -translate-y-1/2 items-stretch"
                  style={{
                    left: `${row.startPct}%`,
                    width: `${row.widthPct}%`,
                  }}
                >
                  <div
                    className={cn(
                      "flex min-w-0 items-center gap-1.5 rounded-l-full px-2 text-[10px] font-medium text-white",
                      row.color.solid,
                    )}
                    style={{ width: `${Math.max(row.progress, 12)}%` }}
                  >
                    <div className="flex -space-x-1.5">
                      {row.task.members.slice(0, 3).map((member, index) => (
                        <span
                          key={`${row.task.id}-${member.initials}`}
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-full border border-white/20 text-[8px] font-semibold text-white",
                            memberColors[index % memberColors.length],
                          )}
                        >
                          {member.initials}
                        </span>
                      ))}
                    </div>
                    <span className="truncate">{row.label}</span>
                  </div>

                  <div className={cn("min-w-2 flex-1 rounded-r-full", row.color.fade)} />

                  <span
                    className={cn(
                      "ml-1 grid size-7 shrink-0 place-items-center rounded-full border bg-secondary text-[10px] font-semibold tabular-nums",
                      row.color.badge,
                    )}
                  >
                    {row.progress}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthlyProgress({
  rows,
}: {
  rows: ReturnType<typeof buildTimelineRows>;
}) {
  return (
    <div className="mt-4 space-y-3">
      {rows.map((row) => (
        <div key={row.task.id} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-medium text-foreground/85">
              {row.task.title}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {row.progress}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted/20">
            <div
              className={cn("h-full rounded-full", row.color.solid)}
              style={{ width: `${row.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
