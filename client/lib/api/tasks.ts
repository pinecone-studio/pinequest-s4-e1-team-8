import type { TaskSource } from "@/components/tasks/task-types";

export type ApiTaskRecord = {
  id: string;
  source: TaskSource;
  projectId: string;
  parentId: string | null;
  title: string;
  description: string | null;
  tool: string;
  status: string;
  priority: string;
  blocked: boolean;
  dueDate: string;
  progress: number;
  timeLeft: string;
  doneCount: number;
  blockedCount: number;
  members: Array<string | { initials: string; avatarUrl?: string }>;
};

export type FetchTasksParams = {
  projectId?: string;
  source?: TaskSource;
  milestones?: boolean;
};

const getServerBaseUrl = () =>
  (process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:8787").replace(
    /\/$/,
    "",
  );

export async function fetchTasks({
  projectId,
  source,
  milestones,
}: FetchTasksParams = {}): Promise<ApiTaskRecord[]> {
  const params = new URLSearchParams();

  if (projectId) {
    params.set("projectId", projectId);
  }

  if (source) {
    params.set("source", source);
  }

  if (milestones) {
    params.set("milestones", "true");
  }

  const query = params.toString();
  const response = await fetch(
    `${getServerBaseUrl()}/tasks${query ? `?${query}` : ""}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to load tasks (${response.status}).`);
  }

  const body = (await response.json()) as { tasks: ApiTaskRecord[] };
  return body.tasks;
}
