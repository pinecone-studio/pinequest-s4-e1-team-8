import type { AsanaTaskPayload } from "./asana";

const GITHUB_BASE_URL = "https://api.github.com";

export type GitHubOwner = {
  login: string;
  id: number;
  avatar_url: string;
};

export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  owner: GitHubOwner;
  default_branch: string;
  updated_at: string;
};

export type GitHubLabel = {
  id: number;
  name: string;
  color: string;
};

export type GitHubMilestone = {
  number: number;
  title: string;
  due_on: string | null;
};

export type GitHubIssue = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  html_url: string;
  user: GitHubOwner;
  labels: GitHubLabel[];
  assignee: GitHubOwner | null;
  milestone: GitHubMilestone | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

async function githubFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${GITHUB_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export const getRepositories = (token: string): Promise<GitHubRepo[]> =>
  githubFetch<GitHubRepo[]>(
    "/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator",
    token,
  );

export const getRepositoryIssues = (
  token: string,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open",
): Promise<GitHubIssue[]> =>
  githubFetch<GitHubIssue[]>(
    `/repos/${owner}/${repo}/issues?state=${state}&per_page=100`,
    token,
  );

export const mapGithubIssueToAsanaTask = (
  issue: GitHubIssue,
  projectGid: string,
): AsanaTaskPayload => {
  const labelList =
    issue.labels.length > 0
      ? `\n\nLabels: ${issue.labels.map((l) => l.name).join(", ")}`
      : "";

  const notes = [
    issue.body ?? "",
    labelList,
    `\n---\nGitHub Issue #${issue.number}: ${issue.html_url}`,
  ]
    .join("")
    .trim();

  return {
    name: issue.title,
    notes,
    completed: issue.state === "closed",
    projects: [projectGid],
    due_on: issue.milestone?.due_on?.slice(0, 10) ?? null,
    assignee: null,
  };
};
