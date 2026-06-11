import { clientApi } from "@/app/lib/client-api";
import { readOnboardingData } from "@/lib/onboarding-storage";

const DEV_USER_ID = "user_wr";
let activeUserId = DEV_USER_ID;

export function setAsanaUserId(userId: string) {
  activeUserId = userId;
}

function uid() {
  return activeUserId;
}

// The active Brisk project — Asana credentials are stored on the project and
// shared by all of its members.
let activeProjectId = "";

export function setAsanaProjectId(projectId: string) {
  activeProjectId = projectId;
}

function pid() {
  return activeProjectId || readOnboardingData()?.projectId || "";
}

export type AsanaStatus = {
  connected: boolean;
  asanaUserName?: string;
  workspaceGid?: string;
  projectGid?: string;
  projectName?: string;
};

export type AsanaWorkspace = {
  gid: string;
  name: string;
};

export type AsanaProject = {
  gid: string;
  name: string;
};

export function getAsanaConnectUrl(returnTo?: string) {
  const params = new URLSearchParams({ userId: uid(), projectId: pid() });
  if (returnTo) {
    params.set("returnTo", returnTo);
  }
  return `/api/auth/asana?${params.toString()}`;
}

export async function fetchAsanaStatus(): Promise<AsanaStatus> {
  const { data } = await clientApi.get<AsanaStatus>("/integrations/asana/status", {
    params: { userId: uid(), projectId: pid() },
  });
  return data;
}

export async function disconnectAsana(): Promise<void> {
  await clientApi.post("/integrations/asana/disconnect", { userId: uid(), projectId: pid() });
}

export async function fetchAsanaWorkspaces(): Promise<AsanaWorkspace[]> {
  const { data } = await clientApi.get<{ workspaces: AsanaWorkspace[] }>(
    "/integrations/asana/workspaces",
    { params: { userId: uid(), projectId: pid() } },
  );
  return data.workspaces;
}

export async function fetchAsanaProjects(workspaceGid: string): Promise<AsanaProject[]> {
  const { data } = await clientApi.get<{ projects: AsanaProject[] }>(
    "/integrations/asana/projects",
    { params: { userId: uid(), projectId: pid(), workspaceGid } },
  );
  return data.projects;
}

export async function selectAsanaProject(params: {
  workspaceGid: string;
  projectGid: string;
  projectName: string;
}) {
  const { data } = await clientApi.post<{
    workspaceGid: string;
    projectGid: string;
    projectName: string | null;
  }>("/integrations/asana/project", {
    userId: uid(),
    projectId: pid(),
    workspaceGid: params.workspaceGid,
    asanaProjectGid: params.projectGid,
    asanaProjectName: params.projectName,
  });
  return data;
}

export async function syncAsanaTasks() {
  const { data } = await clientApi.post<{ synced: number }>("/integrations/asana/sync", {
    userId: uid(), projectId: pid(),
  });
  return data;
}

export function extractAsanaApiError(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "response" in err) {
    return (
      (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
      fallback
    );
  }
  return err instanceof Error ? err.message : fallback;
}
