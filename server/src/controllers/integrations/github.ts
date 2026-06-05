import { and, eq } from "drizzle-orm";
import { Context } from "hono";
import { nanoid } from "nanoid";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import {
  buildGithubAuthorizeUrl,
  createGithubIssue,
  createGithubPull,
  createIssueComment,
  createPullReview,
  fetchCompareDiff,
  fetchIssueComments,
  fetchIssueDetail,
  fetchPullChecks,
  fetchPullCommits,
  fetchPullDetail,
  fetchPullFiles,
  fetchPullReviews,
  fetchRepoLabels,
  generatePrMessageFromDiff,
  mergeGithubPull,
  decodeOAuthState,
  exchangeGithubCode,
  fetchGithubLogin,
  fetchGithubRepos,
  fetchRepoBranches,
  fetchRepoIssues,
  fetchRepoPulls,
  requestPullReviewers,
  updateGithubIssue,
  updateGithubPull,
} from "../../lib/github/github";
import { mapGithubIssueToTask } from "../../lib/github/map-github-issue";
import { DEFAULT_WORKSPACE_ID } from "../../lib/tasks/task-defaults";
import { githubIntegrations, tasks } from "../../schema/schema";

const appUrl = (env: Bindings) => env.CLIENT_APP_URL ?? "http://localhost:3000";

export const getGithubConnect = async (c: Context<{ Bindings: Bindings }>) => {
  const userId = c.req.query("userId");
  if (!userId) return c.json({ error: "userId is required" }, 400);

  try {
    return c.redirect(buildGithubAuthorizeUrl(c.env, userId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth setup failed";
    const params = new URLSearchParams({ error: message });
    return c.redirect(`${appUrl(c.env)}/workflow?${params}`);
  }
};

export const getGithubCallback = async (c: Context<{ Bindings: Bindings }>) => {
  const code = c.req.query("code");
  const stateParam = c.req.query("state");

  if (c.req.query("error") || !code || !stateParam) {
    return c.redirect(`${appUrl(c.env)}/workflow`);
  }

  const state = decodeOAuthState(stateParam);
  if (!state) return c.json({ error: "Invalid OAuth state" }, 400);

  try {
    const accessToken = await exchangeGithubCode(c.env, code);
    const githubLogin = await fetchGithubLogin(accessToken);
    const db = useDB(c);

    const [existing] = await db
      .select({ id: githubIntegrations.id })
      .from(githubIntegrations)
      .where(eq(githubIntegrations.userId, state.userId))
      .limit(1);

    if (existing) {
      await db
        .update(githubIntegrations)
        .set({ accessToken, githubLogin })
        .where(eq(githubIntegrations.id, existing.id));
    } else {
      await db.insert(githubIntegrations).values({
        id: `gh-int-${nanoid(10)}`,
        userId: state.userId,
        accessToken,
        githubLogin,
      });
    }

    return c.redirect(`${appUrl(c.env)}/workflow`);
  } catch {
    return c.redirect(`${appUrl(c.env)}/workflow`);
  }
};

type GithubAuthContext = {
  accessToken: string;
  githubLogin?: string | null;
  repoOwner?: string | null;
  repoName?: string | null;
  integrationId?: string;
  isTestToken: boolean;
};

export async function resolveGithubAuth(
  c: Context<{ Bindings: Bindings }>,
  userId: string,
): Promise<GithubAuthContext | null> {
  try {
    const db = useDB(c);
    const [integration] = await db
      .select()
      .from(githubIntegrations)
      .where(eq(githubIntegrations.userId, userId))
      .limit(1);

    if (integration) {
      return {
        accessToken: integration.accessToken,
        githubLogin: integration.githubLogin,
        repoOwner: integration.repoOwner,
        repoName: integration.repoName,
        integrationId: integration.id,
        isTestToken: false,
      };
    }
  } catch {
    // DB unavailable or migrations missing — fall through to test token
  }

  const testToken = c.env.GITHUB_TEST_TOKEN?.trim();
  if (!testToken) return null;

  try {
    const githubLogin = await fetchGithubLogin(testToken);
    return {
      accessToken: testToken,
      githubLogin,
      isTestToken: true,
    };
  } catch {
    return null;
  }
}

export const getGithubStatus = async (c: Context<{ Bindings: Bindings }>) => {
  const userId = c.req.query("userId");
  if (!userId) return c.json({ error: "userId is required" }, 400);

  const auth = await resolveGithubAuth(c, userId);
  if (!auth) {
    return c.json({ connected: false });
  }

  return c.json({
    connected: true,
    githubLogin: auth.githubLogin,
    repoOwner: auth.repoOwner,
    repoName: auth.repoName,
    mode: auth.isTestToken ? "test-token" : "oauth",
  });
};

export const getGithubRepos = async (c: Context<{ Bindings: Bindings }>) => {
  const userId = c.req.query("userId");
  if (!userId) return c.json({ error: "userId is required" }, 400);

  const auth = await resolveGithubAuth(c, userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const repos = await fetchGithubRepos(auth.accessToken);
    return c.json({
      repos: repos.map((r) => ({
        fullName: r.full_name,
        owner: r.owner.login,
        name: r.name,
        defaultBranch: r.default_branch,
        private: r.private,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch repos";
    return c.json({ error: message }, 502);
  }
};

export const getGithubBranches = async (c: Context<{ Bindings: Bindings }>) => {
  const userId = c.req.query("userId");
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  if (!userId || !owner || !repo) {
    return c.json({ error: "userId, owner, and repo are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const branches = await fetchRepoBranches(auth.accessToken, owner, repo);
    return c.json({ branches: branches.map((b) => b.name) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch branches";
    return c.json({ error: message }, 502);
  }
};

export const getGithubPulls = async (c: Context<{ Bindings: Bindings }>) => {
  const userId = c.req.query("userId");
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const state = (c.req.query("state") as "open" | "closed" | "all") ?? "all";
  if (!userId || !owner || !repo) {
    return c.json({ error: "userId, owner, and repo are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const pulls = await fetchRepoPulls(auth.accessToken, owner, repo, state);
    return c.json({ pulls });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch pull requests";
    return c.json({ error: message }, 502);
  }
};

export const getGithubIssues = async (c: Context<{ Bindings: Bindings }>) => {
  const userId = c.req.query("userId");
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  if (!userId || !owner || !repo) {
    return c.json({ error: "userId, owner, and repo are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const issues = await fetchRepoIssues(auth.accessToken, owner, repo);
    return c.json({ issues });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch issues";
    return c.json({ error: message }, 502);
  }
};

export const postGithubIssue = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as {
    userId?: string;
    owner?: string;
    repo?: string;
    title?: string;
    body?: string;
  } | null;

  if (!body?.userId || !body.owner || !body.repo || !body.title?.trim()) {
    return c.json({ error: "userId, owner, repo, and title are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, body.userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const issue = await createGithubIssue(
      auth.accessToken,
      body.owner,
      body.repo,
      body.title.trim(),
      body.body?.trim() ?? "",
    );

    if (auth.integrationId) {
      const db = useDB(c);
      await db
        .update(githubIntegrations)
        .set({ repoOwner: body.owner, repoName: body.repo })
        .where(eq(githubIntegrations.id, auth.integrationId));
    }

    return c.json({ issue });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create issue";
    return c.json({ error: message }, 502);
  }
};

export const postGithubPull = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as {
    userId?: string;
    owner?: string;
    repo?: string;
    title?: string;
    body?: string;
    head?: string;
    base?: string;
    draft?: boolean;
  } | null;

  if (
    !body?.userId ||
    !body.owner ||
    !body.repo ||
    !body.title?.trim() ||
    !body.head?.trim() ||
    !body.base?.trim()
  ) {
    return c.json(
      { error: "userId, owner, repo, title, head, and base are required" },
      400,
    );
  }

  const auth = await resolveGithubAuth(c, body.userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const pull = await createGithubPull(
      auth.accessToken,
      body.owner,
      body.repo,
      body.title.trim(),
      body.body?.trim() ?? "",
      body.head.trim(),
      body.base.trim(),
      body.draft ?? false,
    );

    if (auth.integrationId) {
      const db = useDB(c);
      await db
        .update(githubIntegrations)
        .set({ repoOwner: body.owner, repoName: body.repo })
        .where(eq(githubIntegrations.id, auth.integrationId));
    }

    return c.json({ pull });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create pull request";
    return c.json({ error: message }, 502);
  }
};

function requireParams(
  c: Context<{ Bindings: Bindings }>,
  fields: Record<string, string | undefined>,
) {
  const missing = Object.entries(fields)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    return c.json({ error: `${missing.join(", ")} required` }, 400);
  }
  return null;
}

function parsePullNumber(value: string | undefined) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export const getGithubPullDetail = async (c: Context<{ Bindings: Bindings }>) => {
  const userId = c.req.query("userId");
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const number = parsePullNumber(c.req.query("number"));
  const err = requireParams(c, { userId, owner, repo, number: number ? String(number) : undefined });
  if (err) return err;

  const auth = await resolveGithubAuth(c, userId!);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const pull = await fetchPullDetail(auth.accessToken, owner!, repo!, number!);
    return c.json({ pull });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch pull request";
    return c.json({ error: message }, 502);
  }
};

export const getGithubPullFiles = async (c: Context<{ Bindings: Bindings }>) => {
  const userId = c.req.query("userId");
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const number = parsePullNumber(c.req.query("number"));
  const err = requireParams(c, { userId, owner, repo, number: number ? String(number) : undefined });
  if (err) return err;

  const auth = await resolveGithubAuth(c, userId!);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const files = await fetchPullFiles(auth.accessToken, owner!, repo!, number!);
    return c.json({ files });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch files";
    return c.json({ error: message }, 502);
  }
};

export const getGithubPullCommits = async (c: Context<{ Bindings: Bindings }>) => {
  const userId = c.req.query("userId");
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const number = parsePullNumber(c.req.query("number"));
  const err = requireParams(c, { userId, owner, repo, number: number ? String(number) : undefined });
  if (err) return err;

  const auth = await resolveGithubAuth(c, userId!);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const commits = await fetchPullCommits(auth.accessToken, owner!, repo!, number!);
    return c.json({ commits });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch commits";
    return c.json({ error: message }, 502);
  }
};

export const getGithubPullComments = async (c: Context<{ Bindings: Bindings }>) => {
  const userId = c.req.query("userId");
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const number = parsePullNumber(c.req.query("number"));
  const err = requireParams(c, { userId, owner, repo, number: number ? String(number) : undefined });
  if (err) return err;

  const auth = await resolveGithubAuth(c, userId!);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const [comments, reviews] = await Promise.all([
      fetchIssueComments(auth.accessToken, owner!, repo!, number!),
      fetchPullReviews(auth.accessToken, owner!, repo!, number!),
    ]);
    return c.json({ comments, reviews });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch comments";
    return c.json({ error: message }, 502);
  }
};

export const getGithubPullChecks = async (c: Context<{ Bindings: Bindings }>) => {
  const userId = c.req.query("userId");
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const sha = c.req.query("sha");
  const err = requireParams(c, { userId, owner, repo, sha });
  if (err) return err;

  const auth = await resolveGithubAuth(c, userId!);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const checks = await fetchPullChecks(auth.accessToken, owner!, repo!, sha!);
    return c.json({ checks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch checks";
    return c.json({ error: message }, 502);
  }
};

export const postGithubPullComment = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as {
    userId?: string;
    owner?: string;
    repo?: string;
    number?: number;
    body?: string;
  } | null;

  if (!body?.userId || !body.owner || !body.repo || !body.number || !body.body?.trim()) {
    return c.json({ error: "userId, owner, repo, number, and body are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, body.userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const comment = await createIssueComment(
      auth.accessToken,
      body.owner,
      body.repo,
      body.number,
      body.body.trim(),
    );
    return c.json({ comment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to post comment";
    return c.json({ error: message }, 502);
  }
};

export const postGithubPullReview = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as {
    userId?: string;
    owner?: string;
    repo?: string;
    number?: number;
    body?: string;
    event?: "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
  } | null;

  if (!body?.userId || !body.owner || !body.repo || !body.number || !body.event) {
    return c.json({ error: "userId, owner, repo, number, and event are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, body.userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const review = await createPullReview(
      auth.accessToken,
      body.owner,
      body.repo,
      body.number,
      body.body?.trim() ?? "",
      body.event,
    );
    return c.json({ review });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit review";
    return c.json({ error: message }, 502);
  }
};

export const patchGithubPull = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as {
    userId?: string;
    owner?: string;
    repo?: string;
    number?: number;
    title?: string;
    body?: string;
    state?: "open" | "closed";
    draft?: boolean;
  } | null;

  if (!body?.userId || !body.owner || !body.repo || !body.number) {
    return c.json({ error: "userId, owner, repo, and number are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, body.userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const pull = await updateGithubPull(auth.accessToken, body.owner, body.repo, body.number, {
      title: body.title,
      body: body.body,
      state: body.state,
      draft: body.draft,
    });
    return c.json({ pull });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update pull request";
    return c.json({ error: message }, 502);
  }
};

export const postGithubPullReviewers = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as {
    userId?: string;
    owner?: string;
    repo?: string;
    number?: number;
    reviewers?: string[];
  } | null;

  if (!body?.userId || !body.owner || !body.repo || !body.number || !body.reviewers?.length) {
    return c.json({ error: "userId, owner, repo, number, and reviewers are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, body.userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const pull = await requestPullReviewers(
      auth.accessToken,
      body.owner,
      body.repo,
      body.number,
      body.reviewers,
    );
    return c.json({ pull });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to request reviewers";
    return c.json({ error: message }, 502);
  }
};

export const postGithubGeneratePrMessage = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as {
    userId?: string;
    owner?: string;
    repo?: string;
    head?: string;
    base?: string;
  } | null;

  if (!body?.userId || !body.owner || !body.repo || !body.head || !body.base) {
    return c.json({ error: "userId, owner, repo, head, and base are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, body.userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const compare = await fetchCompareDiff(
      auth.accessToken,
      body.owner,
      body.repo,
      body.base,
      body.head,
    );
    const generated = generatePrMessageFromDiff(compare, body.head, body.base);
    return c.json({ generated, stats: { files: compare.files.length, commits: compare.total_commits } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate message";
    return c.json({ error: message }, 502);
  }
};

export const getGithubIssueDetail = async (c: Context<{ Bindings: Bindings }>) => {
  const userId = c.req.query("userId");
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const number = parsePullNumber(c.req.query("number"));
  const err = requireParams(c, { userId, owner, repo, number: number ? String(number) : undefined });
  if (err) return err;

  const auth = await resolveGithubAuth(c, userId!);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const issue = await fetchIssueDetail(auth.accessToken, owner!, repo!, number!);
    return c.json({ issue });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch issue";
    return c.json({ error: message }, 502);
  }
};

export const getGithubIssueComments = async (c: Context<{ Bindings: Bindings }>) => {
  const userId = c.req.query("userId");
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const number = parsePullNumber(c.req.query("number"));
  const err = requireParams(c, { userId, owner, repo, number: number ? String(number) : undefined });
  if (err) return err;

  const auth = await resolveGithubAuth(c, userId!);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const comments = await fetchIssueComments(auth.accessToken, owner!, repo!, number!);
    return c.json({ comments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch comments";
    return c.json({ error: message }, 502);
  }
};

export const postGithubIssueComment = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as {
    userId?: string;
    owner?: string;
    repo?: string;
    number?: number;
    body?: string;
  } | null;

  if (!body?.userId || !body.owner || !body.repo || !body.number || !body.body?.trim()) {
    return c.json({ error: "userId, owner, repo, number, and body are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, body.userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const comment = await createIssueComment(
      auth.accessToken,
      body.owner,
      body.repo,
      body.number,
      body.body.trim(),
    );
    return c.json({ comment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to post comment";
    return c.json({ error: message }, 502);
  }
};

export const patchGithubIssue = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as {
    userId?: string;
    owner?: string;
    repo?: string;
    number?: number;
    title?: string;
    body?: string;
    state?: "open" | "closed";
    labels?: string[];
    assignees?: string[];
  } | null;

  if (!body?.userId || !body.owner || !body.repo || !body.number) {
    return c.json({ error: "userId, owner, repo, and number are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, body.userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const issue = await updateGithubIssue(auth.accessToken, body.owner, body.repo, body.number, {
      title: body.title,
      body: body.body,
      state: body.state,
      labels: body.labels,
      assignees: body.assignees,
    });
    return c.json({ issue });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update issue";
    return c.json({ error: message }, 502);
  }
};

export const getGithubLabels = async (c: Context<{ Bindings: Bindings }>) => {
  const userId = c.req.query("userId");
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const err = requireParams(c, { userId, owner, repo });
  if (err) return err;

  const auth = await resolveGithubAuth(c, userId!);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const labels = await fetchRepoLabels(auth.accessToken, owner!, repo!);
    return c.json({ labels });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch labels";
    return c.json({ error: message }, 502);
  }
};

export const postGithubMergePull = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as {
    userId?: string;
    owner?: string;
    repo?: string;
    number?: number;
    mergeMethod?: "merge" | "squash" | "rebase";
  } | null;

  if (!body?.userId || !body.owner || !body.repo || !body.number) {
    return c.json({ error: "userId, owner, repo, and number are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, body.userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const result = await mergeGithubPull(
      auth.accessToken,
      body.owner,
      body.repo,
      body.number,
      body.mergeMethod ?? "merge",
    );

    return c.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to merge pull request";
    return c.json({ error: message }, 502);
  }
};

export const postGithubSync = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as {
    userId?: string;
    owner?: string;
    repo?: string;
  } | null;

  if (!body?.userId || !body.owner || !body.repo) {
    return c.json({ error: "userId, owner, and repo are required" }, 400);
  }

  const db = useDB(c);
  const [integration] = await db
    .select()
    .from(githubIntegrations)
    .where(eq(githubIntegrations.userId, body.userId))
    .limit(1);

  if (!integration) {
    return c.json({ error: "Connect GitHub first" }, 401);
  }

  try {
    const { owner, repo } = body;
    const issues = await fetchRepoIssues(integration.accessToken, owner, repo);
    const rows = issues.map((issue) => mapGithubIssueToTask(issue, owner, repo));

    await db
      .delete(tasks)
      .where(
        and(eq(tasks.source, "github"), eq(tasks.workspaceId, DEFAULT_WORKSPACE_ID)),
      );

    for (const row of rows) {
      await db.insert(tasks).values(row);
    }

    await db
      .update(githubIntegrations)
      .set({ repoOwner: owner, repoName: repo })
      .where(eq(githubIntegrations.id, integration.id));

    return c.json({ synced: rows.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return c.json({ error: message }, 502);
  }
};
