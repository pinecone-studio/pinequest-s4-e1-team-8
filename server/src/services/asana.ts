const ASANA_BASE_URL = "https://app.asana.com/api/1.0";
const ASANA_TOKEN_URL = "https://app.asana.com/-/oauth_token";

export type AsanaUser = {
  gid: string;
  name: string;
  email?: string;
};

export type AsanaWorkspace = {
  gid: string;
  name: string;
};

export type AsanaProject = {
  gid: string;
  name: string;
  archived: boolean;
  created_at: string;
  modified_at: string;
  workspace: { gid: string; name: string };
};

export type AsanaTask = {
  gid: string;
  name: string;
  notes?: string;
  completed: boolean;
  created_at: string;
  modified_at: string;
  due_on?: string | null;
  permalink_url?: string;
  assignee?: { gid: string; name: string } | null;
};

export type AsanaTaskPayload = {
  name: string;
  notes?: string;
  completed?: boolean;
  projects?: string[];
  due_on?: string | null;
  assignee?: string | null;
};

export type AsanaTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  data?: {
    gid: string;
    name: string;
    email?: string;
  };
};

type AsanaEnvelope<T> = { data: T };

async function asanaFetch<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${ASANA_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Asana API error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as AsanaEnvelope<T>;
  return json.data;
}

async function asanaTokenRequest(body: URLSearchParams): Promise<AsanaTokenResponse> {
  const res = await fetch(ASANA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Asana OAuth error ${res.status}: ${text}`);
  }

  return (await res.json()) as AsanaTokenResponse;
}

export async function exchangeAsanaCode(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
): Promise<AsanaTokenResponse> {
  return asanaTokenRequest(
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  );
}

export async function refreshAsanaToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<AsanaTokenResponse> {
  return asanaTokenRequest(
    new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  );
}

export async function revokeAsanaToken(token: string): Promise<void> {
  const res = await fetch("https://app.asana.com/-/oauth_revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }).toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Asana revoke error ${res.status}: ${text}`);
  }
}

export const getCurrentUser = (token: string): Promise<AsanaUser> =>
  asanaFetch<AsanaUser>("/users/me", token);

export const getWorkspaces = (token: string): Promise<AsanaWorkspace[]> =>
  asanaFetch<AsanaWorkspace[]>("/workspaces", token);

export const getProjects = (
  token: string,
  workspaceGid: string,
): Promise<AsanaProject[]> =>
  asanaFetch<AsanaProject[]>(
    `/workspaces/${workspaceGid}/projects?opt_fields=gid,name,archived,created_at,modified_at,workspace`,
    token,
  );

export const createAsanaProject = (
  token: string,
  workspaceGid: string,
  name: string,
): Promise<AsanaProject> =>
  asanaFetch<AsanaProject>("/projects", token, {
    method: "POST",
    body: JSON.stringify({
      data: {
        name,
        workspace: workspaceGid,
      },
    }),
  });

export const getProjectTasks = (
  token: string,
  projectGid: string,
): Promise<AsanaTask[]> =>
  asanaFetch<AsanaTask[]>(
    `/projects/${projectGid}/tasks?opt_fields=gid,name,notes,completed,created_at,modified_at,due_on,permalink_url,assignee.name`,
    token,
  );

export const createTask = (
  token: string,
  payload: AsanaTaskPayload,
): Promise<AsanaTask> =>
  asanaFetch<AsanaTask>("/tasks", token, {
    method: "POST",
    body: JSON.stringify({ data: payload }),
  });

export const updateAsanaTask = (
  token: string,
  taskGid: string,
  payload: Partial<AsanaTaskPayload>,
): Promise<AsanaTask> =>
  asanaFetch<AsanaTask>(`/tasks/${taskGid}`, token, {
    method: "PUT",
    body: JSON.stringify({ data: payload }),
  });
