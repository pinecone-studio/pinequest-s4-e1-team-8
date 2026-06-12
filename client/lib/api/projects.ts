import { clientApi } from "@/app/lib/client-api";
import type { TeamMember, TeamRole } from "@/components/onboarding/onboarding-types";
import type { MilestoneDraft } from "@/lib/onboarding/parse-milestone-drafts";

export const PROJECTS_API_BASE = "/api/backend/projects";

export type ProjectSummary = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  timezone: string | null;
  inviteToken: string | null;
  githubConnected: boolean;
  asanaConnected: boolean;
  aiGoals: string | null;
  isOwner: boolean;
  members: TeamMember[];
};

export type EssentialResource = {
  id: string;
  name: string;
  url: string;
};

export type InitializeProjectPayload = {
  projectId: string;
  workspaceId: string;
  step1: {
    projectName: string;
    description: string;
    timezone: string;
  };
  step2: {
    collaborators: Array<{ email: string; role: TeamRole }>;
  };
  step3: {
    githubConnected: boolean;
    asanaConnected: boolean;
    isGithubDisconnected: boolean;
    isAsanaDisconnected: boolean;
  };
  step4: {
    milestoneDrafts: Array<{
      title: string;
      tasks: string[];
      isApproved: boolean;
    }>;
  };
  onboardingSessionId?: string;
  aiGoals?: string;
  tddLayoutState?: unknown;
  tddConfirmed?: boolean;
  essentialResources?: Array<{ name: string; url: string }>;
};

export type SubTeam = {
  id: string;
  name: string;
  members: Array<{ userId: string; email: string; name: string }>;
};

export async function initializeProject(payload: InitializeProjectPayload) {
  const { data } = await clientApi.post<{
    project: {
      id: string;
      workspaceId: string;
      name: string;
      inviteToken: string | null;
      aiGoals: string | null;
    };
    members: Array<{ email: string; role: TeamRole }>;
  }>(`${PROJECTS_API_BASE}/initialize`, payload);
  projectsCache = null;
  return data;
}

const PROJECTS_CACHE_TTL = 30_000;
let projectsCache: { at: number; projects: ProjectSummary[] } | null = null;
let projectsInFlight: Promise<ProjectSummary[]> | null = null;

/**
 * Fetch the current user's projects, deduping concurrent callers and caching
 * briefly. Many components mount `useOnboardingData` at once (sidebar, header,
 * page hooks); without this they each fire their own request. Pass `force` to
 * bypass the cache (e.g. after creating a project).
 */
export async function fetchMyProjects(options?: { force?: boolean }) {
  const now = Date.now();

  if (!options?.force) {
    if (projectsCache && now - projectsCache.at < PROJECTS_CACHE_TTL) {
      return projectsCache.projects;
    }
    if (projectsInFlight) {
      return projectsInFlight;
    }
  }

  projectsInFlight = (async () => {
    const { data } = await clientApi.get<{ projects: ProjectSummary[] }>(
      `${PROJECTS_API_BASE}/me`,
    );
    projectsCache = { at: Date.now(), projects: data.projects };
    return data.projects;
  })();

  try {
    return await projectsInFlight;
  } finally {
    projectsInFlight = null;
  }
}

export async function fetchProjectMembers(projectId: string) {
  const { data } = await clientApi.get<{
    projectId: string;
    projectName: string;
    inviteToken: string | null;
    members: Array<{
      email: string;
      name: string;
      role: string;
      isOwner: boolean;
    }>;
  }>(`${PROJECTS_API_BASE}/${projectId}/members`);
  return data;
}

export async function fetchInvitePreview(token: string) {
  const { data } = await clientApi.get<{
    projectId: string;
    projectName: string;
    description: string | null;
    ownerName: string;
  }>(`${PROJECTS_API_BASE}/invite/${token}`);
  return data;
}

export async function acceptProjectInvite(token: string) {
  const { data } = await clientApi.post<{
    projectId: string;
    projectName: string;
    alreadyMember: boolean;
  }>(`${PROJECTS_API_BASE}/invite/${token}/accept`);
  return data;
}

export async function fetchSubTeams(projectId: string) {
  const { data } = await clientApi.get<{ subTeams: SubTeam[] }>(
    `${PROJECTS_API_BASE}/${projectId}/sub-teams`,
  );
  return data.subTeams;
}

export async function createSubTeam(projectId: string, name: string) {
  const { data } = await clientApi.post<{ subTeam: SubTeam }>(
    `${PROJECTS_API_BASE}/${projectId}/sub-teams`,
    { name },
  );
  return data.subTeam;
}

export async function addSubTeamMember(subTeamId: string, email: string) {
  await clientApi.post(`${PROJECTS_API_BASE}/sub-teams/${subTeamId}/members`, {
    email,
  });
}

export function buildInviteUrl(inviteToken: string) {
  if (typeof window === "undefined") {
    return `/invite/${inviteToken}`;
  }
  return `${window.location.origin}/invite/${inviteToken}`;
}

export function projectToOnboardingData(
  project: ProjectSummary,
  aiGoals = "",
): import("@/components/onboarding/onboarding-types").OnboardingData {
  return {
    projectId: project.id,
    workspaceId: project.workspaceId,
    projectName: project.name,
    description: project.description ?? "",
    timezone: project.timezone ?? "(GMT+00:00) UTC",
    members: project.members,
    githubConnected: project.githubConnected,
    asanaConnected: project.asanaConnected,
    isGithubDisconnected: !project.githubConnected,
    isAsanaDisconnected: !project.asanaConnected,
    aiGoals: project.aiGoals ?? aiGoals,
  };
}

export async function fetchProjectResources(projectId: string) {
  const { data } = await clientApi.get<{ resources: EssentialResource[] }>(
    `${PROJECTS_API_BASE}/${projectId}/resources`,
  );
  return data.resources;
}

export async function saveProjectResources(
  projectId: string,
  resources: EssentialResource[],
) {
  const { data } = await clientApi.put<{ ok: boolean; resources: EssentialResource[] }>(
    `${PROJECTS_API_BASE}/${projectId}/resources`,
    { resources },
  );
  return data.resources;
}

export async function fetchProjectTdd(projectId: string) {
  const { data } = await clientApi.get<{
    session: {
      id: string;
      status: string;
      tddLayoutState: unknown;
      docUrl: string | null;
    } | null;
  }>(`${PROJECTS_API_BASE}/${projectId}/tdd`);
  return data.session;
}

export function milestoneDraftsToPayload(drafts: MilestoneDraft[]) {
  return drafts.map((draft) => ({
    title: draft.title,
    tasks: draft.tasks,
    isApproved: draft.isApproved,
  }));
}
