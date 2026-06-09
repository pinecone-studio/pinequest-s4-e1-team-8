"use client";

import {
  rememberGithubSyncRepo,
  repoStorageKey,
  saveGithubBoardColumns,
  toBoardColumnDefinitions,
} from "@/components/tasks/task-board/github-columns";
import type { BoardColumnDefinition } from "@/components/tasks/task-types";
import { Button } from "@/components/ui/button";
import { useGithubUserId } from "@/hooks/use-github-user-id";
import { useOnboardingData } from "@/hooks/use-onboarding-data";
import {
  connectGithubPAT,
  disconnectGithub,
  fetchGithubProjects,
  fetchGithubRepos,
  fetchGithubStatus,
  getGithubRepo,
  GITHUB_SYNCED_EVENT,
  GITHUB_TOKEN_URL,
  setGithubUserId,
  syncGithubIssues,
  type GithubProject,
  type GithubRepoOption,
  type GithubStatus,
} from "@/lib/integrations/github";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2, RefreshCw, Unplug } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type TaskGithubConnectProps = {
  onSynced?: () => void;
  onBoardColumnsChange?: (columns: BoardColumnDefinition[] | null) => void;
};

function logGithubError(context: string, err: unknown) {
  console.error(context, err);
}

export function TaskGithubConnect({
  onSynced,
  onBoardColumnsChange,
}: TaskGithubConnectProps) {
  const { userId, isLoaded } = useGithubUserId();
  const { data: onboardingData, refresh: refreshOnboarding } = useOnboardingData();
  const [status, setStatus] = useState<GithubStatus | null>(null);
  const [repos, setRepos] = useState<GithubRepoOption[]>([]);
  const [projects, setProjects] = useState<GithubProject[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [patValue, setPatValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedCount, setLastSyncedCount] = useState<number | null>(null);
  const syncRequestRef = useRef(0);
  const lastSyncedKeyRef = useRef<string | null>(null);

  const publishBoardColumns = useCallback(
    (columns: BoardColumnDefinition[] | null) => {
      onBoardColumnsChange?.(columns);
    },
    [onBoardColumnsChange],
  );

  const syncRepo = useCallback(
    async (
      fullName: string,
      options?: { force?: boolean; githubProjectId?: string },
    ) => {
      const parts = fullName.split("/");
      if (parts.length !== 2) return;
      const [owner, repo] = parts;
      if (!owner || !repo) return;

      const githubProjectId = options?.githubProjectId ?? selectedProjectId;
      const syncKey = `${fullName}:${githubProjectId || "auto"}`;
      if (!options?.force && lastSyncedKeyRef.current === syncKey) {
        return;
      }

      const requestId = ++syncRequestRef.current;
      setIsSyncing(true);
      try {
        const result = await syncGithubIssues(owner, repo, {
          projectId: onboardingData?.projectId,
          githubProjectId: githubProjectId || undefined,
        });
        if (requestId !== syncRequestRef.current) return;

        lastSyncedKeyRef.current = syncKey;
        rememberGithubSyncRepo(fullName);
        setLastSyncedCount(result.synced);

        if (result.githubProjectId) {
          setSelectedProjectId(result.githubProjectId);
        }

        if (result.columns?.length) {
          saveGithubBoardColumns(repoStorageKey(fullName), result.columns);
          publishBoardColumns(toBoardColumnDefinitions(result.columns));
        }

        setStatus((current) =>
          current
            ? {
                ...current,
                repoOwner: owner,
                repoName: repo,
                githubProjectId: result.githubProjectId ?? current.githubProjectId,
              }
            : current,
        );

        if (
          result.projectId &&
          result.resolvedFrom &&
          result.resolvedFrom !== "requested"
        ) {
          await refreshOnboarding();
        }
        window.dispatchEvent(new Event(GITHUB_SYNCED_EVENT));
        onSynced?.();
      } catch (err) {
        if (requestId === syncRequestRef.current) {
          logGithubError("GitHub issue sync failed", err);
        }
      } finally {
        if (requestId === syncRequestRef.current) {
          setIsSyncing(false);
        }
      }
    },
    [
      onSynced,
      onboardingData?.projectId,
      publishBoardColumns,
      refreshOnboarding,
      selectedProjectId,
    ],
  );

  const loadProjects = useCallback(async (owner: string) => {
    try {
      const projectList = await fetchGithubProjects(owner);
      setProjects(projectList);
      return projectList;
    } catch (err) {
      logGithubError("Could not load GitHub projects", err);
      setProjects([]);
      return [];
    }
  }, []);

  const loadReposAndSync = useCallback(
    async (saved?: GithubStatus) => {
      try {
        const repoList = await fetchGithubRepos();
        setRepos(repoList);

        const envRepo = getGithubRepo();
        const savedRepo =
          saved?.repoOwner && saved?.repoName
            ? `${saved.repoOwner}/${saved.repoName}`
            : null;
        const initial =
          savedRepo ??
          (envRepo ? `${envRepo.owner}/${envRepo.repo}` : null) ??
          repoList[0]?.fullName ??
          "";

        setSelectedRepo(initial);

        if (initial) {
          const [owner] = initial.split("/");
          const projectList = owner ? await loadProjects(owner) : [];
          const initialProjectId =
            saved?.githubProjectId ??
            projectList.find((project) => !project.closed)?.id ??
            projectList[0]?.id ??
            "";
          setSelectedProjectId(initialProjectId);
          await syncRepo(initial, {
            githubProjectId: initialProjectId || undefined,
          });
        }
      } catch (err) {
        logGithubError("Could not load GitHub repositories", err);
      }
    },
    [loadProjects, syncRepo],
  );

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await fetchGithubStatus();
      setStatus(next);
      if (next.connected) {
        await loadReposAndSync(next);
      }
    } catch (err) {
      logGithubError("Failed to load GitHub status", err);
    } finally {
      setIsLoading(false);
    }
  }, [loadReposAndSync]);

  useEffect(() => {
    if (!isLoaded) return;
    setGithubUserId(userId);
    void loadStatus();
  }, [isLoaded, userId, loadStatus]);

  const handleConnect = async () => {
    if (!patValue.trim()) return;
    setIsConnecting(true);
    try {
      await connectGithubPAT(patValue.trim());
      setPatValue("");
      await loadStatus();
    } catch (err) {
      logGithubError("GitHub connect failed", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRepoChange = async (fullName: string) => {
    setSelectedRepo(fullName);
    if (!fullName) return;

    const [owner] = fullName.split("/");
    const projectList = owner ? await loadProjects(owner) : [];
    const nextProjectId =
      projectList.find((project) => !project.closed)?.id ??
      projectList[0]?.id ??
      "";
    setSelectedProjectId(nextProjectId);

    await syncRepo(fullName, {
      force: true,
      githubProjectId: nextProjectId || undefined,
    });
  };

  const handleProjectChange = async (projectId: string) => {
    setSelectedProjectId(projectId);
    if (!selectedRepo) return;
    await syncRepo(selectedRepo, { force: true, githubProjectId: projectId });
  };

  const handleSync = async () => {
    if (!selectedRepo) return;
    await syncRepo(selectedRepo, {
      force: true,
      githubProjectId: selectedProjectId || undefined,
    });
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGithub();
      lastSyncedKeyRef.current = null;
      setLastSyncedCount(null);
      setRepos([]);
      setProjects([]);
      setSelectedRepo("");
      setSelectedProjectId("");
      publishBoardColumns(null);
      setPatValue("");
      await loadStatus();
    } catch (err) {
      logGithubError("Failed to disconnect GitHub", err);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Checking GitHub connection...
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div className="space-y-3 rounded-lg border border-dashed border-border/60 bg-card px-4 py-4">
        <div>
          <p className="text-sm font-medium">Connect GitHub</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste a classic personal access token to import issues from your repository.
          </p>
        </div>
        <input
          type="password"
          value={patValue}
          onChange={(event) => setPatValue(event.target.value)}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          className="h-9 w-full rounded-lg border border-border/60 bg-muted px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            className="rounded-lg"
            disabled={isConnecting || !patValue.trim()}
            onClick={() => void handleConnect()}
          >
            {isConnecting ? <Loader2 className="size-4 animate-spin" /> : null}
            Connect GitHub
          </Button>
          <a
            href={GITHUB_TOKEN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-violet-700 hover:underline dark:text-violet-400"
          >
            Create token
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    );
  }

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-card px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">
            Connected as {status.githubLogin ?? "GitHub user"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSyncing
              ? "Syncing issues..."
              : selectedRepo
                ? lastSyncedCount !== null
                  ? `Showing ${lastSyncedCount} issue${lastSyncedCount === 1 ? "" : "s"} from ${selectedRepo}${
                      selectedProject ? ` · board: ${selectedProject.title}` : ""
                    }`
                  : "Select a repository to load issues."
                : "Select a repository to load issues."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            disabled={isSyncing || !selectedRepo}
            onClick={() => void handleSync()}
          >
            <RefreshCw className={cn("size-4", isSyncing && "animate-spin")} />
            Sync issues
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={() => void handleDisconnect()}
          >
            <Unplug className="size-4" />
            Disconnect
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          Repository
          <select
            className="h-9 rounded-lg border border-border/60 bg-muted px-3 text-sm outline-none"
            value={selectedRepo}
            onChange={(event) => void handleRepoChange(event.target.value)}
            disabled={isSyncing}
          >
            <option value="">Select repository</option>
            {repos.map((repo) => (
              <option key={repo.fullName} value={repo.fullName}>
                {repo.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          GitHub Project board
          <select
            className="h-9 rounded-lg border border-border/60 bg-muted px-3 text-sm outline-none"
            value={selectedProjectId}
            onChange={(event) => void handleProjectChange(event.target.value)}
            disabled={isSyncing || projects.length === 0}
          >
            <option value="">
              {projects.length === 0 ? "No projects found" : "Select project"}
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
                {project.closed ? " (closed)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
