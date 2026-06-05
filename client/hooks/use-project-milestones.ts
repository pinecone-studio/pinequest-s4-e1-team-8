"use client";

import { fetchTasks, type ApiTaskRecord } from "@/lib/api/tasks";
import { useOnboardingData } from "@/hooks/use-onboarding-data";
import { useCallback, useEffect, useState } from "react";

export type ProjectMilestone = ApiTaskRecord & {
  subtaskCount: number;
};

export function useProjectMilestones() {
  const { data, loaded, hasProject } = useOnboardingData();
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMilestones = useCallback(async () => {
    if (!data?.projectId) {
      setMilestones([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tasks = await fetchTasks({
        projectId: data.projectId,
        source: "internal",
      });

      const milestoneTasks = tasks.filter((task) => task.parentId === null);
      const subtaskCounts = tasks.reduce<Record<string, number>>(
        (counts, task) => {
          if (!task.parentId) {
            return counts;
          }

          counts[task.parentId] = (counts[task.parentId] ?? 0) + 1;
          return counts;
        },
        {},
      );

      setMilestones(
        milestoneTasks.map((milestone) => ({
          ...milestone,
          subtaskCount: subtaskCounts[milestone.id] ?? 0,
        })),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load milestones.";
      setError(message);
      setMilestones([]);
    } finally {
      setIsLoading(false);
    }
  }, [data?.projectId]);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    if (!hasProject || !data?.projectId) {
      setMilestones([]);
      setIsLoading(false);
      return;
    }

    void loadMilestones();
  }, [data?.projectId, hasProject, loadMilestones, loaded]);

  return {
    milestones,
    isLoading,
    error,
    loaded,
    hasProject,
    projectName: data?.projectName ?? null,
    reload: loadMilestones,
  };
}
