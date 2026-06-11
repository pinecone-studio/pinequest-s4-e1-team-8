"use client";

import { useOnboardingStore } from "@/app/onboarding/use-onboarding-store";
import { GithubPatConnectForm } from "@/components/onboarding/github-pat-connect-form";
import { IntegrationSelect } from "@/features/onboarding/components/integration-select";
import { useInternalUserId } from "@/hooks/use-internal-user-id";
import {
  createGithubProject,
  createGithubRepo,
  extractApiError,
  fetchGithubProjects,
  fetchGithubRepos,
  fetchGithubStatus,
  saveGithubSettings,
  setGithubUserId,
  type GithubProject,
  type GithubRepoOption,
} from "@/lib/integrations/github";
import { onboardingPanelClassName } from "@/components/onboarding/onboarding-layout";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export function OnboardingGithubConnect() {
  const { userId, isLoaded: userReady, syncError } = useInternalUserId();
  const { step1, step3, setGithubConnected } = useOnboardingStore();
  const [githubLogin, setGithubLogin] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [repos, setRepos] = useState<GithubRepoOption[]>([]);
  const [projects, setProjects] = useState<GithubProject[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
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

  const handlePatConnected = async (login: string) => {
    setGithubLogin(login);
    setGithubConnected(true);
    await loadResources();
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

  const handleCreateRepo = async (name: string) => {
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
      if (selectedProjectId) {
        await persistSelection(repo.fullName, selectedProjectId);
      }
    } catch (err) {
      setError(extractApiError(err, "Could not create repository."));
      throw err;
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreateProject = async (title: string) => {
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
      if (selectedRepo) {
        await persistSelection(selectedRepo, project.id);
      }
    } catch (err) {
      setError(extractApiError(err, "Could not create GitHub project."));
      throw err;
    } finally {
      setIsBusy(false);
    }
  };

  const connected = step3.githubConnected;
  const repoProjectReady = Boolean(selectedRepo && selectedProjectId);

  const repoOptions = useMemo(
    () =>
      repos.map((repo) => ({
        value: repo.fullName,
        label: repo.fullName,
      })),
    [repos],
  );

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        value: project.id,
        label: project.owner
          ? `${project.title} · ${project.owner}`
          : project.title,
      })),
    [projects],
  );

  const defaultProjectTitle = `${step1.projectName.trim() || "Brisk"} board`;

  return (
    <section
      className={cn(
        onboardingPanelClassName,
        connected && "border-[#5da283]/30 bg-[#5da283]/5",
      )}
    >
      <div className="flex items-start gap-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-border/80 bg-background text-xs font-bold text-foreground">
          GH
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="space-y-1">
            <h3 className="text-[15px] font-semibold text-foreground">GitHub</h3>
            {connected ? (
              <p className="inline-flex items-center gap-1 text-xs font-medium text-[#5da283]">
                <Check className="size-3.5 shrink-0" />
                Connected{githubLogin ? ` as @${githubLogin}` : ""}
              </p>
            ) : null}
          </div>
          {!connected ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Sync repos, boards, and milestone issues.
            </p>
          ) : null}
        </div>
        {isBusy && !connected ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      <div className="mt-7">
        {isBusy && connected ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading repositories…
          </div>
        ) : connected ? (
          <div className="space-y-7">
            <IntegrationSelect
              label="Repository"
              placeholder="Choose a repository"
              value={selectedRepo}
              options={repoOptions}
              onValueChange={(value) => void handleRepoChange(value)}
              createLabel="Create new repository"
              createDialogTitle="Create repository"
              createDialogDescription="A private repo will be created under your GitHub account."
              createInputLabel="Repository name"
              createInputPlaceholder="my-project"
              onCreate={handleCreateRepo}
              disabled={isBusy}
            />

            <IntegrationSelect
              label="Project board"
              placeholder="Choose a GitHub project"
              value={selectedProjectId}
              options={projectOptions}
              onValueChange={(value) => void handleProjectChange(value)}
              createLabel="Create new board"
              createDialogTitle="Create project board"
              createDialogDescription="Creates a GitHub project linked to your selected repository when possible."
              createInputLabel="Board title"
              createInputPlaceholder={defaultProjectTitle}
              onCreate={handleCreateProject}
              disabled={isBusy}
            />

            {repoProjectReady && settingsSaved ? (
              <p className="text-sm text-[#5da283]">
                Ready to export milestones as issues.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Optional — pick a repo and board to enable milestone export.
              </p>
            )}
          </div>
        ) : (
          <GithubPatConnectForm
            userId={userId}
            disabled={isBusy || !userReady}
            onConnected={handlePatConnected}
          />
        )}
      </div>

      {syncError ? (
        <p className="mt-5 text-sm text-destructive">{syncError}</p>
      ) : null}
      {error ? <p className="mt-5 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
