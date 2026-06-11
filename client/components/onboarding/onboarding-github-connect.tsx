"use client";

import { useOnboardingStore } from "@/app/onboarding/use-onboarding-store";
import { useInternalUserId } from "@/hooks/use-internal-user-id";
import {
  connectGithubPAT,
  createGithubProject,
  createGithubRepo,
  extractApiError,
  fetchGithubProjects,
  fetchGithubRepos,
  fetchGithubStatus,
  getGithubConnectUrl,
  GITHUB_TOKEN_URL,
  saveGithubSettings,
  setGithubUserId,
  type GithubProject,
  type GithubRepoOption,
} from "@/lib/integrations/github";
import { cn } from "@/lib/utils";
import { Check, ExternalLink, Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function GithubMark() {
  return (
    <div className="grid h-6 w-6 place-items-center rounded-full bg-muted/50 text-[13px] font-bold text-foreground">
      GH
    </div>
  );
}

export function OnboardingGithubConnect() {
  const { userId, isLoaded: userReady } = useInternalUserId();
  const { step1, step3, setGithubConnected } = useOnboardingStore();
  const [githubLogin, setGithubLogin] = useState<string | null>(null);
  const [patValue, setPatValue] = useState("");
  const [showPat, setShowPat] = useState(false);
  const [isBusy, setIsBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [repos, setRepos] = useState<GithubRepoOption[]>([]);
  const [projects, setProjects] = useState<GithubProject[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [newRepoName, setNewRepoName] = useState("");
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);

  const loadResources = useCallback(async () => {
    const [repoList, projectList] = await Promise.all([
      fetchGithubRepos(),
      fetchGithubProjects(),
    ]);
    setRepos(repoList);
    setProjects(projectList);
    return { repoList, projectList };
  }, []);

  const loadStatus = useCallback(async () => {
    if (!userReady) {
      return;
    }

    setGithubUserId(userId);
    setIsBusy(true);
    setError(null);

    try {
      const status = await fetchGithubStatus();
      if (status.connected) {
        setGithubLogin(status.githubLogin ?? null);
        setGithubConnected(true);

        const { repoList, projectList } = await loadResources();

        if (status.repoOwner && status.repoName) {
          const key = `${status.repoOwner}/${status.repoName}`;
          setSelectedRepo(key);
          if (!repoList.some((repo) => repo.fullName === key)) {
            setRepos((current) => [
              {
                fullName: key,
                owner: status.repoOwner!,
                name: status.repoName!,
                defaultBranch: "main",
                private: true,
              },
              ...current,
            ]);
          }
        }

        if (status.githubProjectId) {
          setSelectedProjectId(status.githubProjectId);
          if (!projectList.some((project) => project.id === status.githubProjectId)) {
            setProjects((current) => [
              {
                id: status.githubProjectId!,
                number: 0,
                title: "Linked project",
                url: "",
                closed: false,
                shortDescription: null,
                owner: status.githubLogin ?? "",
              },
              ...current,
            ]);
          }
        }

        setSettingsSaved(Boolean(status.repoOwner && status.repoName && status.githubProjectId));
      } else {
        setGithubConnected(false);
      }
    } catch (err) {
      setGithubConnected(false);
      setError(extractApiError(err, "Could not check GitHub connection."));
    } finally {
      setIsBusy(false);
    }
  }, [loadResources, setGithubConnected, userId, userReady]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleOAuthConnect = () => {
    if (!userReady) return;
    setGithubUserId(userId);
    window.location.href = getGithubConnectUrl("/onboarding/step2");
  };

  const handlePatConnect = async () => {
    if (!userReady || !patValue.trim()) {
      return;
    }

    setGithubUserId(userId);
    setIsBusy(true);
    setError(null);

    try {
      const { githubLogin: login } = await connectGithubPAT(patValue.trim());
      setPatValue("");
      setGithubLogin(login);
      setGithubConnected(true);
      await loadResources();
    } catch (err) {
      setGithubConnected(false);
      setError(extractApiError(err, "Could not connect GitHub."));
    } finally {
      setIsBusy(false);
    }
  };

  const persistSelection = async (repoKey: string, projectId: string) => {
    const [owner, name] = repoKey.split("/");
    if (!owner || !name || !projectId) {
      return;
    }
    await saveGithubSettings({
      repoOwner: owner,
      repoName: name,
      githubProjectId: projectId,
    });
    setSettingsSaved(true);
  };

  const handleRepoChange = async (value: string) => {
    setSelectedRepo(value);
    setSettingsSaved(false);
    if (value && selectedProjectId) {
      try {
        await persistSelection(value, selectedProjectId);
      } catch (err) {
        setError(extractApiError(err, "Could not save repository selection."));
      }
    }
  };

  const handleProjectChange = async (value: string) => {
    setSelectedProjectId(value);
    setSettingsSaved(false);
    if (selectedRepo && value) {
      try {
        await persistSelection(selectedRepo, value);
      } catch (err) {
        setError(extractApiError(err, "Could not save project selection."));
      }
    }
  };

  const handleCreateRepo = async () => {
    const name = newRepoName.trim();
    if (!name) return;

    setIsBusy(true);
    setError(null);
    try {
      const repo = await createGithubRepo({
        name,
        description: step1.description.trim() || step1.projectName.trim() || undefined,
        private: true,
      });
      setRepos((current) => [repo, ...current]);
      setSelectedRepo(repo.fullName);
      setNewRepoName("");
      if (selectedProjectId) {
        await persistSelection(repo.fullName, selectedProjectId);
      }
    } catch (err) {
      setError(extractApiError(err, "Could not create repository."));
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreateProject = async () => {
    const title = newProjectTitle.trim() || `${step1.projectName.trim() || "Brisk"} board`;
    const repo = repos.find((item) => item.fullName === selectedRepo);

    setIsBusy(true);
    setError(null);
    try {
      const project = await createGithubProject({
        title,
        repoNodeId: repo?.nodeId ?? undefined,
      });
      setProjects((current) => [project, ...current]);
      setSelectedProjectId(project.id);
      setNewProjectTitle("");
      if (selectedRepo) {
        await persistSelection(selectedRepo, project.id);
      }
    } catch (err) {
      setError(extractApiError(err, "Could not create GitHub project."));
    } finally {
      setIsBusy(false);
    }
  };

  const connected = step3.githubConnected;
  const repoProjectReady = Boolean(selectedRepo && selectedProjectId);

  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-3 rounded-xl border p-4 transition-[border-color,background]",
        connected
          ? "border-emerald-500/40 bg-emerald-50 dark:border-emerald-500/45 dark:bg-emerald-500/10"
          : "border-border bg-muted/40 dark:bg-secondary",
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="grid h-[42px] w-[42px] flex-none place-items-center rounded-[10px] border border-border bg-card">
          <GithubMark />
        </div>
        <div>
          <div className="text-[15px] font-semibold text-foreground">GitHub</div>
          <div className="text-[12.5px] text-foreground">
            Connect, pick a repo & project, export milestones as issues
          </div>
        </div>
      </div>

      {connected ? (
        <div className="space-y-3">
          <div className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-100 text-[13px] font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
            <Check size={15} />
            Connected{githubLogin ? ` as @${githubLogin}` : ""}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Repository
            </label>
            <select
              value={selectedRepo}
              onChange={(event) => void handleRepoChange(event.target.value)}
              disabled={isBusy}
              className="h-9 w-full rounded-lg border border-border/70 bg-background px-3 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:opacity-50"
            >
              <option value="">Select a repository…</option>
              {repos.map((repo) => (
                <option key={repo.fullName} value={repo.fullName}>
                  {repo.fullName}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRepoName}
                onChange={(event) => setNewRepoName(event.target.value)}
                placeholder="new-repo-name"
                disabled={isBusy}
                className="h-8 min-w-0 flex-1 rounded-lg border border-border/70 bg-background px-3 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:opacity-50"
              />
              <button
                type="button"
                disabled={isBusy || !newRepoName.trim()}
                onClick={() => void handleCreateRepo()}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-[12px] font-medium text-foreground hover:bg-accent disabled:opacity-50"
              >
                <Plus className="size-3.5" />
                Create
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              GitHub Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(event) => void handleProjectChange(event.target.value)}
              disabled={isBusy}
              className="h-9 w-full rounded-lg border border-border/70 bg-background px-3 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:opacity-50"
            >
              <option value="">Select a project board…</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                  {project.owner ? ` (${project.owner})` : ""}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="text"
                value={newProjectTitle}
                onChange={(event) => setNewProjectTitle(event.target.value)}
                placeholder={`${step1.projectName.trim() || "Brisk"} board`}
                disabled={isBusy}
                className="h-8 min-w-0 flex-1 rounded-lg border border-border/70 bg-background px-3 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:opacity-50"
              />
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void handleCreateProject()}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-[12px] font-medium text-foreground hover:bg-accent disabled:opacity-50"
              >
                <Plus className="size-3.5" />
                Create
              </button>
            </div>
          </div>

          {repoProjectReady && settingsSaved ? (
            <p className="text-[12px] text-emerald-700 dark:text-emerald-300">
              Ready — milestone tasks will be created as GitHub issues on this project when you finish.
            </p>
          ) : connected ? (
            <p className="text-[12px] text-muted-foreground">
              Select a repository and GitHub project to enable milestone export.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2.5">
          <button
            type="button"
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-transparent bg-violet-600 text-[13px] font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isBusy || !userReady}
            onClick={handleOAuthConnect}
          >
            {isBusy ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Connect with GitHub
          </button>
          <button
            type="button"
            className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => setShowPat((value) => !value)}
          >
            {showPat ? "Hide token option" : "Use a personal access token instead"}
          </button>
          {showPat ? (
            <>
              <input
                type="password"
                value={patValue}
                onChange={(event) => setPatValue(event.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                disabled={isBusy}
                className="h-9 w-full rounded-lg border border-border/70 bg-background px-3 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:opacity-50"
              />
              <button
                type="button"
                className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-[13px] font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isBusy || !patValue.trim()}
                onClick={() => void handlePatConnect()}
              >
                Connect with token
              </button>
              <a
                href={GITHUB_TOKEN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-violet-700 hover:underline dark:text-violet-400"
              >
                Create a personal access token
                <ExternalLink className="size-3" />
              </a>
            </>
          ) : null}
          {error ? <p className="text-[12px] text-rose-500">{error}</p> : null}
        </div>
      )}

      {connected && error ? <p className="text-[12px] text-rose-500">{error}</p> : null}
    </div>
  );
}
