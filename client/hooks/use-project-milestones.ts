"use client";

import { fetchTasks, type ApiTaskRecord } from "@/lib/api/tasks";
import { useOnboardingData } from "@/hooks/use-onboarding-data";
import { GITHUB_SYNCED_EVENT } from "@/lib/integrations/github";
import { type ProjectMilestone } from "@/lib/onboarding/scoped-milestones";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";

export type { ProjectMilestone };

function isMilestoneTask(task: ApiTaskRecord) {
  if (task.parentId !== null) {
    return false;
  }

  return task.source === "internal" || task.id.startsWith("github-milestone-");
}

export function useProjectMilestones() {
  const { isSignedIn } = useAuth();
  const { data, loaded, hasProject } = useOnboardingData();
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMilestones = useCallback(async () => {
    if (!hasProject) {
      setMilestones([]);
      setIsLoading(false);
      return;
    }

    if (!isSignedIn || !data?.projectId?.trim()) {
      setMilestones([]);
      setIsLoading(false);
      setError(isSignedIn ? null : "Sign in to view project milestones.");
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
  }, [data?.projectId, hasProject, isSignedIn]);

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
  }, [data?.projectId, hasProject, loadMilestones, loaded]);

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
