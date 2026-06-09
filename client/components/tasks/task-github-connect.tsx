"use client";

import { Button } from "@/components/ui/button";
import { useGithubUserId } from "@/hooks/use-github-user-id";
import {
  connectGithubPAT,
  disconnectGithub,
  fetchGithubRepos,
  fetchGithubStatus,
  getGithubRepo,
  extractApiError,
  GITHUB_TOKEN_URL,
  setGithubUserId,
  syncGithubIssues,
  type GithubRepoOption,
  type GithubStatus,
} from "@/lib/integrations/github";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2, RefreshCw, Unplug } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type TaskGithubConnectProps = {
  onSynced?: () => void;
};

function formatGithubError(err: unknown, fallback: string) {
  const message = extractApiError(err, fallback);
  if (message.includes("401") || message.includes("Bad credentials")) {
    return "GitHub token expired or was revoked. Disconnect, create a new classic PAT with repo scope, and connect again.";
  }
  return message;
}

export function TaskGithubConnect({ onSynced }: TaskGithubConnectProps) {
  const { userId, isLoaded } = useGithubUserId();
  const [status, setStatus] = useState<GithubStatus | null>(null);
  const [repos, setRepos] = useState<GithubRepoOption[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [patValue, setPatValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedCount, setLastSyncedCount] = useState<number | null>(null);
  const syncRequestRef = useRef(0);
  const lastSyncedKeyRef = useRef<string | null>(null);

  const syncRepo = useCallback(
    async (fullName: string, options?: { force?: boolean }) => {
      const parts = fullName.split("/");
      if (parts.length !== 2) return;
      const [owner, repo] = parts;
      if (!owner || !repo) return;

      const syncKey = fullName;
      if (!options?.force && lastSyncedKeyRef.current === syncKey) {
        return;
      }

      const requestId = ++syncRequestRef.current;
      setIsSyncing(true);
      setError(null);
      try {
        const { synced } = await syncGithubIssues(owner, repo);
        if (requestId !== syncRequestRef.current) return;

        lastSyncedKeyRef.current = syncKey;
        setLastSyncedCount(synced);
        setStatus((current) =>
          current
            ? { ...current, repoOwner: owner, repoName: repo }
            : current,
        );
        onSynced?.();
      } catch (err) {
        if (requestId === syncRequestRef.current) {
          setError(formatGithubError(err, "Failed to sync GitHub issues"));
        }
      } finally {
        if (requestId === syncRequestRef.current) {
          setIsSyncing(false);
        }
      }
    },
    [onSynced],
  );

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
          await syncRepo(initial);
        }
      } catch (err) {
        setError(formatGithubError(err, "Could not load GitHub repositories"));
      }
    },
    [syncRepo],
  );

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const next = await fetchGithubStatus();
      setStatus(next);
      if (next.connected) {
        await loadReposAndSync(next);
      }
    } catch (err) {
      setError(formatGithubError(err, "Failed to load GitHub status"));
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
    setError(null);
    try {
      await connectGithubPAT(patValue.trim());
      setPatValue("");
      await loadStatus();
    } catch (err) {
      setError(formatGithubError(err, "Invalid token — use a classic PAT with the repo scope."));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRepoChange = async (fullName: string) => {
    setSelectedRepo(fullName);
    if (!fullName) return;
    await syncRepo(fullName, { force: true });
  };

  const handleSync = async () => {
    if (!selectedRepo) {
      setError("Select a repository first.");
      return;
    }
    await syncRepo(selectedRepo, { force: true });
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGithub();
      lastSyncedKeyRef.current = null;
      setLastSyncedCount(null);
      setRepos([]);
      setSelectedRepo("");
      setPatValue("");
      await loadStatus();
    } catch (err) {
      setError(formatGithubError(err, "Failed to disconnect GitHub"));
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
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      </div>
    );
  }

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
                  ? `Showing ${lastSyncedCount} issue${lastSyncedCount === 1 ? "" : "s"} from ${selectedRepo}`
                  : `Select a repository to load issues.`
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

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
    </div>
  );
}
