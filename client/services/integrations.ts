import { clientApi } from "@/app/lib/client-api";
import {
  createAsanaProject,
  fetchAsanaProjects,
  fetchAsanaStatus,
  fetchAsanaWorkspaces,
  getAsanaConnectUrl,
  selectAsanaProject,
  setAsanaUserId,
  type AsanaProject,
  type AsanaStatus,
  type AsanaWorkspace,
} from "@/lib/integrations/asana";
import {
  createGithubProject,
  createGithubRepo,
  fetchGithubProjects,
  fetchGithubRepos,
  fetchGithubStatus,
  saveGithubSettings,
  setGithubUserId,
  type GithubProject,
  type GithubRepoOption,
  type GithubStatus,
} from "@/lib/integrations/github";

export type ProjectIntegrationMapping = {
  projectId: string;
  projectName: string;
  githubRepoId: string | null;
  githubRepoOwner: string | null;
  githubRepoName: string | null;
  githubProjectId: string | null;
  githubProjectTitle: string | null;
  asanaProjectGid: string | null;
  asanaProjectName: string | null;
};

export type ProvisionProjectPayload = {
  name: string;
  description?: string;
  workspaceId?: string;
  integrations: {
    githubRepoOwner: string;
    githubRepoName: string;
    githubRepoId: string;
    githubProjectId: string;
    githubProjectTitle: string;
    asanaWorkspaceGid: string;
    asanaProjectGid: string;
    asanaProjectName: string;
  };
};

export type ProvisionProjectResult = {
  projectId: string;
  workspaceId: string;
  name: string;
  inviteToken: string;
  integration: ProvisionProjectPayload["integrations"];
};

export function configureIntegrationUser(userId: string) {
  setGithubUserId(userId);
  setAsanaUserId(userId);
}

export function getAsanaConnectUrlForReturn(returnTo: string) {
  return getAsanaConnectUrl(returnTo);
}

export async function fetchIntegrationStatuses(): Promise<{
  github: GithubStatus;
  asana: AsanaStatus;
}> {
  const [github, asana] = await Promise.all([
    fetchGithubStatus(),
    fetchAsanaStatus(),
  ]);
  return { github, asana };
}

export async function fetchGithubResources() {
  const [repos, projects] = await Promise.all([
    fetchGithubRepos(),
    fetchGithubProjects(),
  ]);
  return { repos, projects };
}

export async function fetchAsanaResources() {
  const workspaces = await fetchAsanaWorkspaces();
  const projectsByWorkspace = await Promise.all(
    workspaces.map(async (workspace) => ({
      workspace,
      projects: await fetchAsanaProjects(workspace.gid),
    })),
  );
  return { workspaces, projectsByWorkspace };
}

export async function fetchProjectIntegrationMappings(): Promise<
  ProjectIntegrationMapping[]
> {
  const { data } = await clientApi.get<{ mappings: ProjectIntegrationMapping[] }>(
    "/api/backend/onboarding/integration-mappings",
  );
  return data.mappings;
}

export function isGithubRepoMapped(
  mappings: ProjectIntegrationMapping[],
  repoId: string,
) {
  return mappings.some((mapping) => mapping.githubRepoId === repoId);
}

export function isGithubProjectMapped(
  mappings: ProjectIntegrationMapping[],
  projectId: string,
) {
  return mappings.some((mapping) => mapping.githubProjectId === projectId);
}

export function isAsanaProjectMapped(
  mappings: ProjectIntegrationMapping[],
  projectGid: string,
) {
  return mappings.some((mapping) => mapping.asanaProjectGid === projectGid);
}

export function filterGithubRepos(
  repos: GithubRepoOption[],
  mappings: ProjectIntegrationMapping[],
) {
  return repos.map((repo) => {
    const repoId = repo.id ?? repo.nodeId ?? repo.fullName;
    return {
      ...repo,
      disabled: isGithubRepoMapped(mappings, repoId),
    };
  });
}

export function filterGithubProjects(
  projects: GithubProject[],
  mappings: ProjectIntegrationMapping[],
  repoOwner?: string,
) {
  return projects
    .filter((project) => !repoOwner || project.owner === repoOwner)
    .map((project) => ({
      ...project,
      disabled: isGithubProjectMapped(mappings, project.id),
    }));
}

export function filterAsanaProjects(
  projects: AsanaProject[],
  mappings: ProjectIntegrationMapping[],
) {
  return projects.map((project) => ({
    ...project,
    disabled: isAsanaProjectMapped(mappings, project.gid),
  }));
}

export async function createGithubRepoOptimistic(
  params: { name: string; description?: string; private?: boolean },
  currentRepos: GithubRepoOption[],
) {
  const repo = await createGithubRepo(params);
  const repoId = repo.id ?? repo.nodeId ?? repo.fullName;
  return {
    repo: { ...repo, id: repoId },
    repos: [{ ...repo, id: repoId }, ...currentRepos],
  };
}

export async function createGithubProjectOptimistic(
  params: { title: string; repoNodeId?: string },
  currentProjects: GithubProject[],
) {
  const project = await createGithubProject(params);
  return {
    project,
    projects: [project, ...currentProjects],
  };
}

export async function createAsanaProjectOptimistic(
  params: { workspaceGid: string; name: string },
  currentProjects: AsanaProject[],
) {
  const project = await createAsanaProject(params);
  return {
    project,
    projects: [project, ...currentProjects],
  };
}

export async function persistGithubSelection(params: {
  repoOwner: string;
  repoName: string;
  githubProjectId: string;
}) {
  await saveGithubSettings(params);
}

export async function persistAsanaSelection(params: {
  workspaceGid: string;
  projectGid: string;
  projectName: string;
}) {
  await selectAsanaProject(params);
}

export async function provisionProject(
  payload: ProvisionProjectPayload,
): Promise<ProvisionProjectResult> {
  const { data } = await clientApi.post<{ project: ProvisionProjectResult }>(
    "/api/backend/onboarding/provision",
    payload,
  );
  return data.project;
}

export type {
  AsanaProject,
  AsanaStatus,
  AsanaWorkspace,
  GithubProject,
  GithubRepoOption,
  GithubStatus,
};
