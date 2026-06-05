import type { Bindings } from "../common/types";

export type GithubIssue = {
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  pull_request?: { url: string };
  labels: { name: string }[];
  assignees: { login: string; avatar_url: string }[];
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
