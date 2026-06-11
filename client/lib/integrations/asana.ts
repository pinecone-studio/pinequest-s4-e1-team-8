import { clientApi } from "@/app/lib/client-api";

const DEV_USER_ID = "user_wr";
let activeUserId = DEV_USER_ID;

export function setAsanaUserId(userId: string) {
  activeUserId = userId;
}

function uid() {
  return activeUserId;
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

export const ASANA_TOKEN_URL = "https://app.asana.com/0/my-apps";

export async function connectAsanaPAT(
  token: string,
): Promise<{ asanaUserName: string }> {
  const { data } = await clientApi.post<{ asanaUserName: string }>(
    "/integrations/asana/pat",
    {
      userId: uid(),
      token,
    },
  );
  return data;
}

export function getAsanaConnectUrl(returnTo?: string) {
  const params = new URLSearchParams({ userId: uid() });
  if (returnTo) {
    params.set("returnTo", returnTo);
  }
  return `/api/auth/asana?${params.toString()}`;
}

export async function fetchAsanaStatus(): Promise<AsanaStatus> {
  const { data } = await clientApi.get<AsanaStatus>("/integrations/asana/status", {
    params: { userId: uid() },
  });
  return data;
}

export async function disconnectAsana(): Promise<void> {
  await clientApi.post("/integrations/asana/disconnect", { userId: uid() });
}

export async function fetchAsanaWorkspaces(): Promise<AsanaWorkspace[]> {
  const { data } = await clientApi.get<{ workspaces: AsanaWorkspace[] }>(
    "/integrations/asana/workspaces",
    { params: { userId: uid() } },
  );
  return data.workspaces;
}

export async function fetchAsanaProjects(workspaceGid: string): Promise<AsanaProject[]> {
  const { data } = await clientApi.get<{ projects: AsanaProject[] }>(
    "/integrations/asana/projects",
    { params: { userId: uid(), workspaceGid } },
  );
  return data.projects;
}

export async function createAsanaProject(params: {
  workspaceGid: string;
  name: string;
}): Promise<AsanaProject> {
  const { data } = await clientApi.post<{ project: AsanaProject }>(
    "/integrations/asana/projects/create",
    { userId: uid(), ...params },
  );
  return data.project;
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
    ...params,
  });
  return data;
}

export async function syncAsanaTasks() {
  const { data } = await clientApi.post<{ synced: number }>("/integrations/asana/sync", {
    userId: uid(),
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
