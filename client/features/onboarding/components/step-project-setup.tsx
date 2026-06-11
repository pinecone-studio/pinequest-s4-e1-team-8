"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AsanaProject,
  AsanaWorkspace,
  GithubProject,
  GithubRepoOption,
  ProjectIntegrationMapping,
} from "@/services/integrations";
import {
  createAsanaProjectOptimistic,
  createGithubProjectOptimistic,
  createGithubRepoOptimistic,
  filterAsanaProjects,
  filterGithubProjects,
  filterGithubRepos,
} from "@/services/integrations";
import type { UseFormReturn } from "react-hook-form";
import type { ProjectSetupValues } from "../types";
import { IntegrationSelect } from "./integration-select";

type StepProjectSetupProps = {
  form: UseFormReturn<ProjectSetupValues>;
  repos: GithubRepoOption[];
  projects: GithubProject[];
  workspaces: AsanaWorkspace[];
  asanaProjectsByWorkspace: Record<string, AsanaProject[]>;
  mappings: ProjectIntegrationMapping[];
  loading: boolean;
  onReposChange: (repos: GithubRepoOption[]) => void;
  onProjectsChange: (projects: GithubProject[]) => void;
  onAsanaProjectsChange: (workspaceGid: string, projects: AsanaProject[]) => void;
};

export function StepProjectSetup({
  form,
  repos,
  projects,
  workspaces,
  asanaProjectsByWorkspace,
  mappings,
  loading,
  onReposChange,
  onProjectsChange,
  onAsanaProjectsChange,
}: StepProjectSetupProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const githubRepoId = watch("githubRepoId");
  const githubRepoOwner = watch("githubRepoOwner");
  const asanaWorkspaceGid = watch("asanaWorkspaceGid");

  const filteredRepos = filterGithubRepos(repos, mappings);
  const selectedRepo = filteredRepos.find(
    (repo) => (repo.id ?? repo.nodeId ?? repo.fullName) === githubRepoId,
  );
  const filteredProjects = filterGithubProjects(
    projects,
    mappings,
    selectedRepo?.owner ?? githubRepoOwner,
  );
  const workspaceAsanaProjects = asanaWorkspaceGid
    ? (asanaProjectsByWorkspace[asanaWorkspaceGid] ?? [])
    : [];
  const filteredAsanaProjects = filterAsanaProjects(
    workspaceAsanaProjects,
    mappings,
  );

  const handleRepoChange = (repoId: string) => {
    const repo = filteredRepos.find(
      (item) => (item.id ?? item.nodeId ?? item.fullName) === repoId,
    );
    if (!repo) return;

    setValue("githubRepoId", repoId, { shouldValidate: true });
    setValue("githubRepoOwner", repo.owner, { shouldValidate: true });
    setValue("githubRepoName", repo.name, { shouldValidate: true });
    setValue("githubRepoNodeId", repo.nodeId ?? undefined);
    setValue("githubProjectId", "", { shouldValidate: true });
    setValue("githubProjectTitle", "", { shouldValidate: true });
  };

  const handleGithubProjectChange = (projectId: string) => {
    const project = filteredProjects.find((item) => item.id === projectId);
    if (!project) return;

    setValue("githubProjectId", project.id, { shouldValidate: true });
    setValue("githubProjectTitle", project.title, { shouldValidate: true });
  };

  const handleWorkspaceChange = (workspaceGid: string) => {
    setValue("asanaWorkspaceGid", workspaceGid, { shouldValidate: true });
    setValue("asanaProjectGid", "", { shouldValidate: true });
    setValue("asanaProjectName", "", { shouldValidate: true });
  };

  const handleAsanaProjectChange = (projectGid: string) => {
    const project = filteredAsanaProjects.find((item) => item.gid === projectGid);
    if (!project) return;

    setValue("asanaProjectGid", project.gid, { shouldValidate: true });
    setValue("asanaProjectName", project.name, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Set up your project
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose or create the GitHub and Asana resources for this Brisk project.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectName">Project name</Label>
        <Input
          id="projectName"
          placeholder="My product launch"
          disabled={loading}
          aria-invalid={Boolean(errors.projectName)}
          {...register("projectName")}
        />
        {errors.projectName ? (
          <p className="text-xs text-destructive">{errors.projectName.message}</p>
        ) : null}
      </div>

      <IntegrationSelect
        label="GitHub repository"
        placeholder="Select a repository"
        value={githubRepoId}
        options={filteredRepos.map((repo) => ({
          value: repo.id ?? repo.nodeId ?? repo.fullName,
          label: repo.fullName,
          disabled: repo.disabled,
        }))}
        onValueChange={handleRepoChange}
        createLabel="New repo"
        createDialogTitle="Create GitHub repository"
        createDialogDescription="A new private repository will be created in your GitHub account."
        createInputLabel="Repository name"
        createInputPlaceholder="my-brisk-project"
        disabled={loading}
        error={errors.githubRepoId?.message}
        onCreate={async (name) => {
          const projectName = form.getValues("projectName");
          const { repo, repos: nextRepos } = await createGithubRepoOptimistic(
            {
              name,
              description: projectName || undefined,
              private: true,
            },
            repos,
          );
          onReposChange(nextRepos);
          handleRepoChange(repo.id ?? repo.nodeId ?? repo.fullName);
        }}
      />

      <IntegrationSelect
        label="GitHub project"
        placeholder={
          githubRepoId ? "Select a project board" : "Select a repository first"
        }
        value={watch("githubProjectId")}
        options={filteredProjects.map((project) => ({
          value: project.id,
          label: `${project.title}${project.owner ? ` (${project.owner})` : ""}`,
          disabled: project.disabled,
        }))}
        onValueChange={handleGithubProjectChange}
        createLabel="New project"
        createDialogTitle="Create GitHub project"
        createDialogDescription="Creates a new GitHub Project v2 board linked to the selected repository."
        createInputLabel="Project title"
        createInputPlaceholder={form.getValues("projectName") || "Brisk board"}
        disabled={loading || !githubRepoId}
        error={errors.githubProjectId?.message}
        onCreate={async (title) => {
          const { project, projects: nextProjects } =
            await createGithubProjectOptimistic(
              {
                title,
                repoNodeId: selectedRepo?.nodeId ?? undefined,
              },
              projects,
            );
          onProjectsChange(nextProjects);
          handleGithubProjectChange(project.id);
        }}
      />

      <div className="space-y-2">
        <Label>Asana workspace</Label>
        <Select
          value={asanaWorkspaceGid || null}
          onValueChange={(value) => handleWorkspaceChange(value ?? "")}
          disabled={loading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a workspace" />
          </SelectTrigger>
          <SelectContent>
            {workspaces.map((workspace) => (
              <SelectItem key={workspace.gid} value={workspace.gid}>
                {workspace.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.asanaWorkspaceGid ? (
          <p className="text-xs text-destructive">
            {errors.asanaWorkspaceGid.message}
          </p>
        ) : null}
      </div>

      <IntegrationSelect
        label="Asana project"
        placeholder={
          asanaWorkspaceGid
            ? "Select an Asana project"
            : "Select a workspace first"
        }
        value={watch("asanaProjectGid")}
        options={filteredAsanaProjects.map((project) => ({
          value: project.gid,
          label: project.name,
          disabled: project.disabled,
        }))}
        onValueChange={handleAsanaProjectChange}
        createLabel="New project"
        createDialogTitle="Create Asana project"
        createDialogDescription="A new project will be created in the selected workspace."
        createInputLabel="Project name"
        createInputPlaceholder={form.getValues("projectName") || "Brisk project"}
        disabled={loading || !asanaWorkspaceGid}
        error={errors.asanaProjectGid?.message}
        onCreate={async (name) => {
          const workspaceGid = form.getValues("asanaWorkspaceGid");
          const { project, projects: nextProjects } =
            await createAsanaProjectOptimistic(
              { workspaceGid, name },
              workspaceAsanaProjects,
            );
          onAsanaProjectsChange(workspaceGid, nextProjects);
          handleAsanaProjectChange(project.gid);
        }}
      />
    </div>
  );
}
