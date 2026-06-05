import type { Bindings } from "../common/types";

export type GithubUser = {
  login: string;
  avatar_url: string;
};

export type GithubIssue = {
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  html_url?: string;
  pull_request?: { url: string };
  labels: { name: string; color?: string }[];
  assignees: GithubUser[];
  user?: GithubUser;
  created_at?: string;
  updated_at?: string;
};

const GITHUB_HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "brisk-app",
};

function githubAuth(token: string) {
  return { ...GITHUB_HEADERS, Authorization: `Bearer ${token}` };
}

export function buildGithubAuthorizeUrl(bindings: Bindings, userId: string): string {
  const { GITHUB_CLIENT_ID: clientId, GITHUB_OAUTH_REDIRECT_URI: redirectUri } = bindings;
  if (!clientId || !redirectUri) throw new Error("GitHub OAuth is not configured");

  const state = btoa(JSON.stringify({ userId, nonce: crypto.randomUUID() }));
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo read:user",
    state,
  });

  return `https://github.com/login/oauth/authorize?${params}`;
}

export function decodeOAuthState(value: string): { userId: string } | null {
  try {
    const parsed = JSON.parse(atob(value)) as { userId?: string };
    return parsed.userId ? { userId: parsed.userId } : null;
  } catch {
    return null;
  }
}

export async function exchangeGithubCode(bindings: Bindings, code: string): Promise<string> {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_OAUTH_REDIRECT_URI } = bindings;
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_OAUTH_REDIRECT_URI) {
    throw new Error("GitHub OAuth is not configured");
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: GITHUB_OAUTH_REDIRECT_URI,
    }),
  });

  const data = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description ?? data.error ?? "Token exchange failed");
  }

  return data.access_token;
}

export async function fetchGithubLogin(accessToken: string): Promise<string> {
  const response = await fetch("https://api.github.com/user", {
    headers: githubAuth(accessToken),
  });
  if (!response.ok) throw new Error("Failed to fetch GitHub user");

  const data = (await response.json()) as { login: string };
  return data.login;
}

export async function fetchRepoIssues(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<GithubIssue[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`,
    { headers: githubAuth(accessToken) },
  );

  if (!response.ok) {
    throw new Error(`GitHub API error (${response.status})`);
  }

  const issues = (await response.json()) as GithubIssue[];
  return issues.filter((issue) => !issue.pull_request);
}

export type GithubRepo = {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
  default_branch: string;
  private: boolean;
};

export type GithubBranch = {
  name: string;
};

export type GithubPull = {
  number: number;
  title: string;
  body?: string | null;
  state: "open" | "closed" | "merged";
  html_url: string;
  head: { ref: string; sha?: string };
  base: { ref: string; sha?: string };
  user: GithubUser;
  created_at: string;
  updated_at?: string;
  draft?: boolean;
  merged?: boolean;
  mergeable?: boolean | null;
  mergeable_state?: string;
  rebaseable?: boolean | null;
};

export type GithubCreatedIssue = {
  number: number;
  title: string;
  html_url: string;
  state: string;
};

export type GithubCreatedPull = {
  number: number;
  title: string;
  html_url: string;
  state: string;
};

async function githubJson<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: { ...githubAuth(accessToken), ...init?.headers },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`GitHub API error (${response.status}): ${text}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchGithubRepos(accessToken: string): Promise<GithubRepo[]> {
  return githubJson<GithubRepo[]>(
    accessToken,
    "/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator",
  );
}

export async function fetchRepoBranches(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<GithubBranch[]> {
  return githubJson<GithubBranch[]>(
    accessToken,
    `/repos/${owner}/${repo}/branches?per_page=100`,
  );
}

export async function fetchRepoPulls(
  accessToken: string,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "all",
): Promise<GithubPull[]> {
  return githubJson<GithubPull[]>(
    accessToken,
    `/repos/${owner}/${repo}/pulls?state=${state}&sort=updated&per_page=30`,
  );
}

export async function fetchPullDetail(
  accessToken: string,
  owner: string,
  repo: string,
  number: number,
): Promise<GithubPull> {
  return githubJson<GithubPull>(
    accessToken,
    `/repos/${owner}/${repo}/pulls/${number}`,
  );
}

export type GithubPullFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
};

export async function fetchPullFiles(
  accessToken: string,
  owner: string,
  repo: string,
  number: number,
): Promise<GithubPullFile[]> {
  return githubJson<GithubPullFile[]>(
    accessToken,
    `/repos/${owner}/${repo}/pulls/${number}/files?per_page=100`,
  );
}

export type GithubPullCommit = {
  sha: string;
  commit: { message: string; author: { name: string; date: string } };
  author: GithubUser | null;
  html_url: string;
};

export async function fetchPullCommits(
  accessToken: string,
  owner: string,
  repo: string,
  number: number,
): Promise<GithubPullCommit[]> {
  return githubJson<GithubPullCommit[]>(
    accessToken,
    `/repos/${owner}/${repo}/pulls/${number}/commits?per_page=100`,
  );
}

export type GithubComment = {
  id: number;
  body: string;
  user: GithubUser;
  created_at: string;
  html_url: string;
};

export async function fetchIssueComments(
  accessToken: string,
  owner: string,
  repo: string,
  number: number,
): Promise<GithubComment[]> {
  return githubJson<GithubComment[]>(
    accessToken,
    `/repos/${owner}/${repo}/issues/${number}/comments?per_page=100`,
  );
}

export type GithubReview = {
  id: number;
  user: GithubUser;
  body: string | null;
  state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "DISMISSED" | "PENDING";
  submitted_at: string;
  html_url: string;
};

export async function fetchPullReviews(
  accessToken: string,
  owner: string,
  repo: string,
  number: number,
): Promise<GithubReview[]> {
  return githubJson<GithubReview[]>(
    accessToken,
    `/repos/${owner}/${repo}/pulls/${number}/reviews?per_page=100`,
  );
}

export async function createIssueComment(
  accessToken: string,
  owner: string,
  repo: string,
  number: number,
  body: string,
): Promise<GithubComment> {
  return githubJson<GithubComment>(
    accessToken,
    `/repos/${owner}/${repo}/issues/${number}/comments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    },
  );
}

export async function createPullReview(
  accessToken: string,
  owner: string,
  repo: string,
  number: number,
  body: string,
  event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT",
): Promise<GithubReview> {
  return githubJson<GithubReview>(
    accessToken,
    `/repos/${owner}/${repo}/pulls/${number}/reviews`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, event }),
    },
  );
}

export type GithubCheckRun = {
  id: number;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion: string | null;
  html_url: string;
  started_at: string;
  completed_at: string | null;
};

export type GithubChecksResult = {
  state: string;
  total_count: number;
  check_runs: GithubCheckRun[];
};

export async function fetchPullChecks(
  accessToken: string,
  owner: string,
  repo: string,
  sha: string,
): Promise<GithubChecksResult> {
  const combined = await githubJson<{ state: string; total_count: number }>(
    accessToken,
    `/repos/${owner}/${repo}/commits/${sha}/status`,
  );
  const checkRuns = await githubJson<{ check_runs: GithubCheckRun[] }>(
    accessToken,
    `/repos/${owner}/${repo}/commits/${sha}/check-runs?per_page=100`,
  );
  return {
    state: combined.state,
    total_count: combined.total_count,
    check_runs: checkRuns.check_runs,
  };
}

export type GithubUpdatePullInput = {
  title?: string;
  body?: string;
  state?: "open" | "closed";
  draft?: boolean;
};

export async function updateGithubPull(
  accessToken: string,
  owner: string,
  repo: string,
  number: number,
  input: GithubUpdatePullInput,
): Promise<GithubPull> {
  return githubJson<GithubPull>(
    accessToken,
    `/repos/${owner}/${repo}/pulls/${number}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export async function requestPullReviewers(
  accessToken: string,
  owner: string,
  repo: string,
  number: number,
  reviewers: string[],
): Promise<GithubPull> {
  return githubJson<GithubPull>(
    accessToken,
    `/repos/${owner}/${repo}/pulls/${number}/requested_reviewers`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewers }),
    },
  );
}

export type GithubLabel = {
  name: string;
  color: string;
  description: string | null;
};

export async function fetchRepoLabels(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<GithubLabel[]> {
  return githubJson<GithubLabel[]>(
    accessToken,
    `/repos/${owner}/${repo}/labels?per_page=100`,
  );
}

export type GithubUpdateIssueInput = {
  title?: string;
  body?: string;
  state?: "open" | "closed";
  labels?: string[];
  assignees?: string[];
};

export async function updateGithubIssue(
  accessToken: string,
  owner: string,
  repo: string,
  number: number,
  input: GithubUpdateIssueInput,
): Promise<GithubIssue> {
  return githubJson<GithubIssue>(
    accessToken,
    `/repos/${owner}/${repo}/issues/${number}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export async function fetchIssueDetail(
  accessToken: string,
  owner: string,
  repo: string,
  number: number,
): Promise<GithubIssue> {
  return githubJson<GithubIssue>(
    accessToken,
    `/repos/${owner}/${repo}/issues/${number}`,
  );
}

export type GithubCompareFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
};

export type GithubCompareResult = {
  files: GithubCompareFile[];
  commits: { sha: string; commit: { message: string } }[];
  ahead_by: number;
  behind_by: number;
  total_commits: number;
};

export async function fetchCompareDiff(
  accessToken: string,
  owner: string,
  repo: string,
  base: string,
  head: string,
): Promise<GithubCompareResult> {
  return githubJson<GithubCompareResult>(
    accessToken,
    `/repos/${owner}/${repo}/compare/${base}...${head}`,
  );
}

export function generatePrMessageFromDiff(
  compare: GithubCompareResult,
  head: string,
  base: string,
): { title: string; body: string } {
  const fileList = compare.files
    .map((f) => `- ${f.status === "added" ? "+" : f.status === "removed" ? "-" : "~"} \`${f.filename}\``)
    .join("\n");
  const totalAdd = compare.files.reduce((s, f) => s + f.additions, 0);
  const totalDel = compare.files.reduce((s, f) => s + f.deletions, 0);
  const mainFile = compare.files[0]?.filename ?? "changes";
  const scope = mainFile.includes("/") ? mainFile.split("/")[0] : "app";

  return {
    title: `feat(${scope}): update ${compare.files.length} file(s) from ${head}`,
    body: [
      "## What changed",
      "",
      fileList,
      "",
      `**${compare.files.length} files changed** +${totalAdd} -${totalDel}`,
      "",
      "## Why",
      "",
      `Merging \`${head}\` into \`${base}\`.`,
      "",
      "## Test plan",
      "",
      "- [ ] Verify changes locally",
      "- [ ] Run existing tests",
    ].join("\n"),
  };
}

export async function createGithubIssue(
  accessToken: string,
  owner: string,
  repo: string,
  title: string,
  body: string,
): Promise<GithubCreatedIssue> {
  return githubJson<GithubCreatedIssue>(
    accessToken,
    `/repos/${owner}/${repo}/issues`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    },
  );
}

export async function createGithubPull(
  accessToken: string,
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string,
  draft = false,
): Promise<GithubCreatedPull> {
  return githubJson<GithubCreatedPull>(
    accessToken,
    `/repos/${owner}/${repo}/pulls`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, head, base, draft }),
    },
  );
}

export type GithubMergedPull = {
  sha: string;
  merged: boolean;
  message: string;
};

export async function mergeGithubPull(
  accessToken: string,
  owner: string,
  repo: string,
  pullNumber: number,
  mergeMethod: "merge" | "squash" | "rebase" = "merge",
): Promise<GithubMergedPull> {
  return githubJson<GithubMergedPull>(
    accessToken,
    `/repos/${owner}/${repo}/pulls/${pullNumber}/merge`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merge_method: mergeMethod }),
    },
  );
}
