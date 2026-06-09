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
  isOwner: boolean;
  members: TeamMember[];
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
    };
    members: Array<{ email: string; role: TeamRole }>;
  }>(`${PROJECTS_API_BASE}/initialize`, payload);
  return data;
}

export async function fetchMyProjects() {
  const { data } = await clientApi.get<{ projects: ProjectSummary[] }>(
    `${PROJECTS_API_BASE}/me`,
  );
  return data.projects;
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
    aiGoals,
  };
}

export function milestoneDraftsToPayload(drafts: MilestoneDraft[]) {
  return drafts.map((draft) => ({
    title: draft.title,
    tasks: draft.tasks,
    isApproved: draft.isApproved,
  }));
}
