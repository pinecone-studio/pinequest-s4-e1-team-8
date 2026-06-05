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
  mode?: "oauth" | "test-token";
};

export type GithubRepoOption = {
  fullName: string;
  owner: string;
  name: string;
  defaultBranch: string;
  private: boolean;
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
  user?: { login: string; avatar_url: string };
  created_at?: string;
  updated_at?: string;
};

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

export function getGithubRepo(): { owner: string; repo: string } | null {
  const value = process.env.NEXT_PUBLIC_GITHUB_REPO;
  if (!value?.includes("/")) return null;
  const [owner, repo] = value.split("/");
  return owner && repo ? { owner, repo } : null;
}

export function redirectToGithubConnect() {
  window.location.href = `/integrations/github/connect?userId=${encodeURIComponent(uid())}`;
}

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

export async function syncGithubIssues() {
  const repo = getGithubRepo();
  if (!repo) return;
  await clientApi.post("/integrations/github/sync", {
    userId: uid(),
    owner: repo.owner,
    repo: repo.repo,
  });
}

export function extractApiError(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "response" in err) {
    return (
      (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? fallback
    );
  }
  return err instanceof Error ? err.message : fallback;
}
