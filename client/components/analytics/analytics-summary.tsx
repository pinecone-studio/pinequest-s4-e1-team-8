"use client";

import { AnalyticsPulseSummary } from "@/components/analytics/analytics-pulse-summary";
import {
  computePulseMetrics,
  countContributors,
  filterTasksByTeam,
} from "@/components/analytics/analytics-pulse-utils";
import { AnalyticsTeamTimeline } from "@/components/analytics/analytics-team-timeline";
import { AnalyticsWeekly } from "@/components/analytics/analytics-weekly";
import { clientApi, TASKS_API_BASE } from "@/app/lib/client-api";
import { readStoredTasks } from "@/components/tasks/task-storage";
import { AnalyticsTeamSelect } from "@/components/analytics/analytics-team-select";
import type { TaskListItem } from "@/components/tasks/task-types";
import type { AnalyticsWeekly as AnalyticsWeeklyData } from "@/lib/analytics/types";
import {
  mapApiTaskToListItem,
  type ApiTaskListItem,
} from "@/lib/tasks/map-api-task";
import { useEffect, useMemo, useState } from "react";

export function AnalyticsSummary() {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [activeTeam, setActiveTeam] = useState<string | null>(null);
  const [weekly, setWeekly] = useState<AnalyticsWeeklyData | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setIsLoadingTasks(true);

    clientApi
      .get<{ tasks: ApiTaskListItem[] }>(TASKS_API_BASE)
      .then((response) => {
        if (!cancelled) {
          setTasks(response.data.tasks.map(mapApiTaskToListItem));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTasks(readStoredTasks() ?? []);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingTasks(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const query = activeTeam
      ? `?team=${encodeURIComponent(activeTeam)}`
      : "";

    clientApi
      .get<{ weekly: AnalyticsWeeklyData }>(`/analytics/weekly${query}`)
      .then((response) => {
        if (!cancelled) {
          setWeekly(response.data.weekly);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWeekly(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTeam]);

  const scopedTasks = useMemo(
    () => filterTasksByTeam(tasks, activeTeam),
    [tasks, activeTeam],
  );

  const metrics = useMemo(
    () => computePulseMetrics(scopedTasks, weekly),
    [scopedTasks, weekly],
  );

  const authorCount = useMemo(
    () => countContributors(scopedTasks),
    [scopedTasks],
  );

  return (
    <div className="space-y-5">
      {isLoadingTasks ? (
        <p className="text-sm text-muted-foreground">Loading teams...</p>
      ) : (
        <AnalyticsTeamSelect
          activeTeam={activeTeam}
          tasks={tasks}
          onChange={setActiveTeam}
        />
      )}

      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        {activeTeam ? (
          <AnalyticsTeamTimeline
            teamName={activeTeam}
            tasks={tasks}
            summaryOverlay={
              <AnalyticsPulseSummary
                activeTeam={activeTeam}
                weekly={weekly}
                metrics={metrics}
                authorCount={authorCount}
              />
            }
          />
        ) : (
          <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/60 px-4 py-8 text-center text-sm text-muted-foreground">
            Select a team from the dropdown to view its schedule and progress
            timeline.
          </div>
        )}

        <AnalyticsWeekly
          activeTeam={activeTeam}
          tasks={tasks}
          className="min-h-[400px]"
        />
      </div>
    </div>
  );
}
