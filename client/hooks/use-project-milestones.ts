"use client";

import { fetchTasks, type ApiTaskRecord } from "@/lib/api/tasks";
import { useOnboardingData } from "@/hooks/use-onboarding-data";
import { GITHUB_SYNCED_EVENT } from "@/lib/integrations/github";
import {
  mapScopedMilestonesToProjectMilestones,
  resolveScopedMilestones,
  type ProjectMilestone,
} from "@/lib/onboarding/scoped-milestones";
import { useCallback, useEffect, useState } from "react";

export type { ProjectMilestone };

function isMilestoneTask(task: ApiTaskRecord) {
  if (task.parentId !== null) {
    return false;
  }

  return task.source === "internal" || task.id.startsWith("github-milestone-");
}

export function useProjectMilestones() {
  const { data, loaded, hasProject } = useOnboardingData();
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyScopedMilestoneFallback = useCallback(() => {
    const scoped = resolveScopedMilestones(data?.scopedMilestones);
    const projectId = data?.projectId?.trim() || "demo-project";

    setMilestones(mapScopedMilestonesToProjectMilestones(scoped, projectId));
    setError(null);
    return true;
  }, [data?.projectId, data?.scopedMilestones]);

  const loadMilestones = useCallback(async () => {
    if (!hasProject) {
      setMilestones([]);
      setIsLoading(false);
      return;
    }

    if (!data?.projectId?.trim()) {
      applyScopedMilestoneFallback();
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tasks = await fetchTasks({
        projectId: data.projectId,
      });

      const milestoneTasks = tasks.filter(isMilestoneTask);
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

      if (milestoneTasks.length > 0) {
        setMilestones(
          milestoneTasks.map((milestone) => ({
            ...milestone,
            subtaskCount: subtaskCounts[milestone.id] ?? 0,
          })),
        );
        return;
      }

      if (!applyScopedMilestoneFallback()) {
        setMilestones([]);
      }
    } catch (err) {
      if (!applyScopedMilestoneFallback()) {
        const message =
          err instanceof Error ? err.message : "Failed to load milestones.";
        setError(message);
        setMilestones([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [applyScopedMilestoneFallback, data?.projectId, hasProject]);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    if (!hasProject) {
      setMilestones([]);
      setIsLoading(false);
      return;
    }

    void loadMilestones();
  }, [data?.projectId, data?.scopedMilestones, hasProject, loadMilestones, loaded]);

  useEffect(() => {
    const handleGithubSynced = () => {
      void loadMilestones();
    };

    window.addEventListener(GITHUB_SYNCED_EVENT, handleGithubSynced);
    return () => {
      window.removeEventListener(GITHUB_SYNCED_EVENT, handleGithubSynced);
    };
  }, [loadMilestones]);

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
