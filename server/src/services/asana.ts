const ASANA_BASE_URL = "https://app.asana.com/api/1.0";

export type AsanaUser = {
  gid: string;
  name: string;
  email: string;
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
  notes: string;
  completed: boolean;
  created_at: string;
  modified_at: string;
  permalink_url: string;
};

export type AsanaTaskPayload = {
  name: string;
  notes?: string;
  completed?: boolean;
  projects?: string[];
  due_on?: string | null;
  assignee?: string | null;
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

export const createTask = (
  token: string,
  payload: AsanaTaskPayload,
): Promise<AsanaTask> =>
  asanaFetch<AsanaTask>("/tasks", token, {
    method: "POST",
    body: JSON.stringify({ data: payload }),
  });
