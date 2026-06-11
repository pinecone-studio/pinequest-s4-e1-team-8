"use client";

import { useOnboardingData } from "@/hooks/use-onboarding-data";
import { fetchTasks, type ApiTaskRecord } from "@/lib/api/tasks";
import {
  fetchGithubIssues,
  getGithubRepo,
  GITHUB_SYNCED_EVENT,
  type GithubIssueItem,
} from "@/lib/integrations/github";
import { normalizeMembers } from "@/lib/tasks/map-api-task";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TimelineItem } from "./timeline-types";
import { addDays, clampPercent, parseDate, startOfDay } from "./timeline-utils";

function initialsFromLogin(login: string): string {
  const cleaned = login.replace(/[^a-zA-Z0-9]/g, "");
  return (cleaned.slice(0, 2) || "?").toUpperCase();
}

function estimateSpanDays(timeLeft?: string): number {
  if (!timeLeft) {
    return 7;
  }
  const match = timeLeft.match(/(\d+)\s*(mo|months?|weeks?|days?|hours?|[dwhm])/i);
  if (!match) {
    return 7;
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit.startsWith("mo") || unit === "m") {
    return Math.max(amount * 30, 1);
  }
  if (unit.startsWith("w")) {
    return Math.max(amount * 7, 1);
  }
  if (unit.startsWith("h")) {
    return 1;
  }
  return Math.max(amount, 1);
}

function githubIssueToItem(issue: GithubIssueItem): TimelineItem | null {
  // Only open issues belong on the timeline.
  if (issue.state === "closed") {
    return null;
  }

  const created = parseDate(issue.created_at);
  if (!created) {
    return null;
  }

  const today = startOfDay(new Date());
  const end = addDays(today > created ? today : created, 5);
  const inProgress = issue.assignees.length > 0;

  return {
    id: `github-${issue.number}`,
    source: "github",
    title: issue.title,
    status: inProgress ? "In progress" : "Open",
    progress: inProgress ? 35 : 0,
    start: created,
    end,
    blocked: false,
    url: issue.html_url,
    meta: `#${issue.number}`,
    members: issue.assignees.map((assignee) => ({
      initials: initialsFromLogin(assignee.login),
      avatarUrl: assignee.avatar_url,
    })),
  };
}

function apiTaskToItem(task: ApiTaskRecord): TimelineItem | null {
  const due = parseDate(task.dueDate);
  if (!due) {
    return null;
  }

  const span = estimateSpanDays(task.timeLeft);
  const start = addDays(due, -span);

  return {
    id: task.id,
    source: task.source,
    title: task.title,
    status: task.status,
    progress: clampPercent(task.progress),
    start,
    end: due,
    blocked: task.blocked,
    meta: task.tool,
    members: normalizeMembers(task.members),
  };
}

export type ProgressItemsState = {
  items: TimelineItem[];
  loading: boolean;
  error: string | null;
  githubUnavailable: boolean;
  hasProject: boolean;
  reload: () => void;
};

export function useProgressItems(): ProgressItemsState {
  const { data, loaded, hasProject } = useOnboardingData();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [githubUnavailable, setGithubUnavailable] = useState(false);
  const mountedRef = useRef(false);

  const projectId = data?.projectId?.trim() ?? "";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const repo = getGithubRepo();
    const [githubResult, taskResult] = await Promise.allSettled([
      repo ? fetchGithubIssues(repo.owner, repo.repo) : Promise.resolve([]),
      projectId ? fetchTasks({ projectId }) : Promise.resolve([]),
    ]);

    if (!mountedRef.current) {
      return;
    }

    const next: TimelineItem[] = [];

    if (githubResult.status === "fulfilled") {
      setGithubUnavailable(false);
      for (const issue of githubResult.value) {
        const item = githubIssueToItem(issue);
        if (item) {
          next.push(item);
        }
      }
    } else {
      setGithubUnavailable(true);
    }

    if (taskResult.status === "fulfilled") {
      for (const task of taskResult.value) {
        // GitHub issues come from the issues API above to avoid duplicates.
        if (task.source === "github") {
          continue;
        }
        const item = apiTaskToItem(task);
        if (item) {
          next.push(item);
        }
      }
    }

    if (
      githubResult.status === "rejected" &&
      taskResult.status === "rejected"
    ) {
      setError("Couldn't load timeline data from GitHub or the task service.");
    }

    next.sort((a, b) => a.start.getTime() - b.start.getTime());
    setItems(next);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }
    void load();
  }, [load, loaded]);

  useEffect(() => {
    const handleSynced = () => void load();
    window.addEventListener(GITHUB_SYNCED_EVENT, handleSynced);
    return () => window.removeEventListener(GITHUB_SYNCED_EVENT, handleSynced);
  }, [load]);

  return {
    items,
    loading,
    error,
    githubUnavailable,
    hasProject,
    reload: () => void load(),
  };
}
