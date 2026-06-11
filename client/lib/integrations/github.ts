import { clientApi } from "@/app/lib/client-api";

const DEV_USER_ID = "user_wr";
let activeUserId = DEV_USER_ID;

export function setGithubUserId(userId: string) {
  activeUserId = userId;
}

function uid() {
  return activeUserId;
}

export type GithubStatus = {
  connected: boolean;
  githubLogin?: string;
  repoOwner?: string;
  repoName?: string;
  githubProjectId?: string | null;
};

export type GithubRepoOption = {
  id?: string;
  fullName: string;
  owner: string;
  name: string;
  defaultBranch: string;
  private: boolean;
  nodeId?: string | null;
};

export type GithubPullItem = {
  number: number;
  title: string;
  body?: string | null;
  state: "open" | "closed" | "merged";
  html_url: string;
  head: { ref: string; sha?: string };
  base: { ref: string; sha?: string };
  user: { login: string; avatar_url: string };
  created_at: string;
  updated_at?: string;
  draft?: boolean;
  merged?: boolean;
  mergeable?: boolean | null;
  mergeable_state?: string;
  rebaseable?: boolean | null;
};

export type GithubIssueItem = {
  number: number;
  title: string;
  state: "open" | "closed";
  body: string | null;
  html_url?: string;
  labels: { name: string; color?: string }[];
  assignees: { login: string; avatar_url: string }[];
  milestone?: { number: number; title: string } | null;
  user?: { login: string; avatar_url: string };
  created_at?: string;
  updated_at?: string;
};

export type GithubMilestone = {
  number: number;
  title: string;
  description: string | null;
  state: "open" | "closed";
  due_on: string | null;
  open_issues: number;
  closed_issues: number;
};

export type GithubAssignee = { login: string; avatar_url: string };

export type GithubPullFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
};

export type GithubComment = {
  id: number;
  body: string;
  user: { login: string; avatar_url: string };
  created_at: string;
  html_url: string;
};

export type GithubReview = {
  id: number;
  user: { login: string; avatar_url: string };
  body: string | null;
  state: string;
  submitted_at: string;
  html_url: string;
};

export type GithubCheckRun = {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
};

export type GithubLabel = {
  name: string;
  color: string;
  description: string | null;
};

export type WorkflowItem =
  | { kind: "pull"; data: GithubPullItem }
  | { kind: "issue"; data: GithubIssueItem };

export type PrFilter = "open" | "closed" | "all";

const DEFAULT_GITHUB_REPO = "pinecone-studio/pinequest-s4-e1-brisk";

export function getGithubRepo(): { owner: string; repo: string } | null {
  const value = process.env.NEXT_PUBLIC_GITHUB_REPO?.trim() || DEFAULT_GITHUB_REPO;
  if (!value.includes("/")) return null;
  const [owner, repo] = value.split("/");
  return owner && repo ? { owner, repo } : null;
}

export async function connectGithubPAT(token: string): Promise<{ githubLogin: string }> {
  const { data } = await clientApi.post<{ githubLogin: string }>("/integrations/github/pat", {
    userId: uid(),
    token,
  });
  return data;
}

export async function saveGithubSettings(settings: {
  repoOwner?: string;
  repoName?: string;
  githubProjectId?: string | null;
}): Promise<void> {
  await clientApi.patch("/integrations/github/settings", {
    userId: uid(),
    ...settings,
  });
}

export async function createGithubRepo(params: {
  name: string;
  description?: string;
  private?: boolean;
}): Promise<GithubRepoOption> {
  const { data } = await clientApi.post<{ repo: GithubRepoOption & { nodeId?: string } }>(
    "/integrations/github/repos/create",
    { userId: uid(), ...params },
  );
  return {
    ...data.repo,
    nodeId: data.repo.nodeId ?? null,
  };
}

export async function createGithubProject(params: {
  title: string;
  repoNodeId?: string;
}): Promise<GithubProject> {
  const { data } = await clientApi.post<{ project: GithubProject }>(
    "/integrations/github/projects/create",
    { userId: uid(), ...params },
  );
  return data.project;
}

export type GithubMilestoneExportResult = {
  milestonesCreated: number;
  issuesCreated: number;
  projectItemsAdded: number;
  issues: Array<{ number: number; title: string; html_url: string; milestoneTitle: string }>;
};

export async function exportGithubMilestones(params: {
  owner?: string;
  repo?: string;
  githubProjectId?: string;
  milestones: Array<{ title: string; tasks: string[] }>;
}): Promise<GithubMilestoneExportResult> {
  const { data } = await clientApi.post<GithubMilestoneExportResult>(
    "/integrations/github/export-milestones",
    { userId: uid(), ...params },
  );
  return data;
}

export async function disconnectGithub(): Promise<void> {
  await clientApi.post("/integrations/github/disconnect", { userId: uid() });
}

/** GitHub "new token (classic)" page, pre-filled with full scopes for Brisk. */
export const GITHUB_TOKEN_URL =
  "https://github.com/settings/tokens/new?scopes=repo,workflow,write:packages,delete:packages,admin:org,admin:public_key,admin:repo_hook,admin:org_hook,gist,notifications,user,delete_repo,write:discussion,admin:enterprise,admin:gpg_key,codespace,project,admin:ssh_signing_key&description=Full%20Access%20Token";

type RepoParams = { owner: string; repo: string };

export async function fetchGithubStatus(): Promise<GithubStatus> {
  const { data } = await clientApi.get<GithubStatus>("/integrations/github/status", {
    params: { userId: uid() },
  });
  return data;
}

export async function fetchGithubRepos(): Promise<GithubRepoOption[]> {
  const { data } = await clientApi.get<{ repos: GithubRepoOption[] }>(
    "/integrations/github/repos",
    { params: { userId: uid() } },
  );
  return data.repos;
}

export async function fetchGithubBranches(owner: string, repo: string): Promise<string[]> {
  const { data } = await clientApi.get<{ branches: string[] }>(
    "/integrations/github/branches",
    { params: { userId: uid(), owner, repo } },
  );
  return data.branches;
}

export async function fetchGithubPulls(
  owner: string,
  repo: string,
  state: PrFilter = "all",
): Promise<GithubPullItem[]> {
  const { data } = await clientApi.get<{ pulls: GithubPullItem[] }>(
    "/integrations/github/pulls",
    { params: { userId: uid(), owner, repo, state } },
  );
  return data.pulls;
}

export async function fetchGithubIssues(owner: string, repo: string): Promise<GithubIssueItem[]> {
  const { data } = await clientApi.get<{ issues: GithubIssueItem[] }>(
    "/integrations/github/issues",
    { params: { userId: uid(), owner, repo } },
  );
  return data.issues;
}

export async function fetchPullDetail(owner: string, repo: string, number: number) {
  const { data } = await clientApi.get<{ pull: GithubPullItem }>(
    "/integrations/github/pulls/detail",
    { params: { userId: uid(), owner, repo, number } },
  );
  return data.pull;
}

export async function fetchPullFiles(owner: string, repo: string, number: number) {
  const { data } = await clientApi.get<{ files: GithubPullFile[] }>(
    "/integrations/github/pulls/files",
    { params: { userId: uid(), owner, repo, number } },
  );
  return data.files;
}

export async function fetchPullCommits(owner: string, repo: string, number: number) {
  const { data } = await clientApi.get<{ commits: unknown[] }>(
    "/integrations/github/pulls/commits",
    { params: { userId: uid(), owner, repo, number } },
  );
  return data.commits;
}

export async function fetchPullComments(owner: string, repo: string, number: number) {
  const { data } = await clientApi.get<{ comments: GithubComment[]; reviews: GithubReview[] }>(
    "/integrations/github/pulls/comments",
    { params: { userId: uid(), owner, repo, number } },
  );
  return data;
}

export async function fetchPullChecks(owner: string, repo: string, sha: string) {
  const { data } = await clientApi.get<{
    checks: { state: string; total_count: number; check_runs: GithubCheckRun[] };
  }>("/integrations/github/pulls/checks", {
    params: { userId: uid(), owner, repo, sha },
  });
  return data.checks;
}

export async function createGithubIssue(params: RepoParams & { title: string; body: string }) {
  const { data } = await clientApi.post<{ issue: { number: number; html_url: string } }>(
    "/integrations/github/issues",
    { userId: uid(), ...params },
  );
  return data.issue;
}

export async function createGithubPull(
  params: RepoParams & {
    title: string;
    body: string;
    head: string;
    base: string;
    draft?: boolean;
  },
) {
  const { data } = await clientApi.post<{ pull: { number: number; html_url: string } }>(
    "/integrations/github/pulls",
    { userId: uid(), ...params },
  );
  return data.pull;
}

export async function mergeGithubPull(
  params: RepoParams & {
    number: number;
    mergeMethod?: "merge" | "squash" | "rebase";
  },
) {
  const { data } = await clientApi.post<{
    result: { sha: string; merged: boolean; message: string };
  }>("/integrations/github/pulls/merge", { userId: uid(), ...params });
  return data.result;
}

export async function postPullComment(
  params: RepoParams & { number: number; body: string },
) {
  const { data } = await clientApi.post<{ comment: GithubComment }>(
    "/integrations/github/pulls/comment",
    { userId: uid(), ...params },
  );
  return data.comment;
}

export async function postPullReview(
  params: RepoParams & {
    number: number;
    body: string;
    event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
  },
) {
  const { data } = await clientApi.post<{ review: GithubReview }>(
    "/integrations/github/pulls/review",
    { userId: uid(), ...params },
  );
  return data.review;
}

export async function patchPull(
  params: RepoParams & {
    number: number;
    title?: string;
    body?: string;
    state?: "open" | "closed";
    draft?: boolean;
  },
) {
  const { data } = await clientApi.patch<{ pull: GithubPullItem }>(
    "/integrations/github/pulls",
    { userId: uid(), ...params },
  );
  return data.pull;
}

export async function generatePrMessage(params: RepoParams & { head: string; base: string }) {
  const { data } = await clientApi.post<{
    generated: { title: string; body: string };
    stats: { files: number; commits: number };
  }>("/integrations/github/pulls/generate", { userId: uid(), ...params });
  return data;
}

export async function fetchIssueDetail(owner: string, repo: string, number: number) {
  const { data } = await clientApi.get<{ issue: GithubIssueItem }>(
    "/integrations/github/issues/detail",
    { params: { userId: uid(), owner, repo, number } },
  );
  return data.issue;
}

export async function fetchIssueComments(owner: string, repo: string, number: number) {
  const { data } = await clientApi.get<{ comments: GithubComment[] }>(
    "/integrations/github/issues/comments",
    { params: { userId: uid(), owner, repo, number } },
  );
  return data.comments;
}

export async function postIssueComment(
  params: RepoParams & { number: number; body: string },
) {
  const { data } = await clientApi.post<{ comment: GithubComment }>(
    "/integrations/github/issues/comment",
    { userId: uid(), ...params },
  );
  return data.comment;
}

export async function patchIssue(
  params: RepoParams & {
    number: number;
    title?: string;
    body?: string;
    state?: "open" | "closed";
    labels?: string[];
    assignees?: string[];
    milestone?: number | null;
  },
) {
  const { data } = await clientApi.patch<{ issue: GithubIssueItem }>(
    "/integrations/github/issues",
    { userId: uid(), ...params },
  );
  return data.issue;
}

export async function fetchRepoLabels(owner: string, repo: string) {
  const { data } = await clientApi.get<{ labels: GithubLabel[] }>(
    "/integrations/github/labels",
    { params: { userId: uid(), owner, repo } },
  );
  return data.labels;
}

export async function fetchRepoMilestones(owner: string, repo: string) {
  const { data } = await clientApi.get<{ milestones: GithubMilestone[] }>(
    "/integrations/github/milestones",
    { params: { userId: uid(), owner, repo } },
  );
  return data.milestones;
}

export async function createMilestone(
  params: RepoParams & { title: string; description?: string; dueOn?: string },
) {
  const { data } = await clientApi.post<{ milestone: GithubMilestone }>(
    "/integrations/github/milestones",
    { userId: uid(), ...params },
  );
  return data.milestone;
}

export async function fetchRepoAssignees(owner: string, repo: string) {
  const { data } = await clientApi.get<{ assignees: GithubAssignee[] }>(
    "/integrations/github/assignees",
    { params: { userId: uid(), owner, repo } },
  );
  return data.assignees;
}

export type GithubBoardColumn = {
  id: string;
  name: string;
};

export type GithubSyncResult = {
  synced: number;
  milestones?: number;
  issues?: number;
  projectId?: string;
  resolvedFrom?: "requested" | "accessible" | "default";
  githubProjectId?: string | null;
  columns?: GithubBoardColumn[];
};

export async function syncGithubIssues(
  owner: string,
  repo: string,
  options?: {
    projectId?: string;
    githubProjectId?: string;
  },
): Promise<GithubSyncResult> {
  const { data } = await clientApi.post<GithubSyncResult>(
    "/integrations/github/sync",
    {
      userId: uid(),
      owner,
      repo,
      ...(options?.projectId ? { projectId: options.projectId } : {}),
      ...(options?.githubProjectId
        ? { githubProjectId: options.githubProjectId }
        : {}),
    },
  );
  return data;
}

export const GITHUB_SYNCED_EVENT = "github-synced";

export type GithubProject = {
  id: string;
  number: number;
  title: string;
  url: string;
  closed: boolean;
  shortDescription: string | null;
  owner: string;
};

export type GithubProjectField = {
  id: string;
  name: string;
  dataType: string;
  options?: { id: string; name: string }[];
};

export type GithubProjectItemContent =
  | { type: "Issue"; id: string; title: string; number: number; state: string; url: string; body?: string | null }
  | { type: "PullRequest"; id: string; title: string; number: number; state: string; url: string }
  | { type: "DraftIssue"; id: string; title: string; body?: string | null }
  | null;

export type GithubProjectFieldValue = {
  fieldId: string;
  fieldName: string;
  value: string | number | null;
  optionId?: string;
};

export type GithubProjectItem = {
  id: string;
  type: "ISSUE" | "PULL_REQUEST" | "DRAFT_ISSUE";
  content: GithubProjectItemContent;
  fieldValues: GithubProjectFieldValue[];
};

export type ProjectFieldValue =
  | { text: string }
  | { number: number }
  | { date: string }
  | { singleSelectOptionId: string }
  | { iterationId: string };

export async function fetchGithubProjects(org?: string): Promise<GithubProject[]> {
  const { data } = await clientApi.get<{ projects: GithubProject[] }>(
    "/integrations/github/projects",
    { params: { userId: uid(), ...(org ? { org } : {}) } },
  );
  return data.projects;
}

export async function fetchGithubProjectDetail(
  projectId: string,
): Promise<{ fields: GithubProjectField[]; items: GithubProjectItem[] }> {
  const { data } = await clientApi.get<{ fields: GithubProjectField[]; items: GithubProjectItem[] }>(
    "/integrations/github/projects/detail",
    { params: { userId: uid(), projectId } },
  );
  return data;
}

export async function addGithubProjectItem(params: {
  projectId: string;
  contentId?: string;
  title?: string;
  itemBody?: string;
}): Promise<string> {
  const { data } = await clientApi.post<{ itemId: string }>(
    "/integrations/github/projects/items",
    { userId: uid(), ...params },
  );
  return data.itemId;
}

export async function updateGithubProjectItemField(params: {
  projectId: string;
  itemId: string;
  fieldId: string;
  value: ProjectFieldValue;
}): Promise<void> {
  await clientApi.patch("/integrations/github/projects/items", { userId: uid(), ...params });
}

export function extractApiError(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "response" in err) {
    return (
      (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? fallback
    );
  }
  return err instanceof Error ? err.message : fallback;
}
