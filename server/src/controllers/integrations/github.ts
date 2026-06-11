import { and, eq, inArray } from "drizzle-orm";
import { Context } from "hono";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { runD1Statements } from "../../lib/db/d1-batch";
import { userCanAccessProject } from "../../lib/projects/project-access";
import {
  addProjectDraftItem,
  addProjectItemById,
  fetchOrgProjects,
  fetchProjectDetail,
  fetchUserProjects,
  updateProjectItemField,
  type ProjectFieldValue,
} from "../../lib/github/projects";
import {
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
  fetchRepoMilestones,
  createRepoMilestone,
  fetchRepoAssignees,
  generatePrMessageFromDiff,
  mergeGithubPull,
  fetchGithubLogin,
  fetchGithubRepos,
  fetchRepoBranches,
  fetchRepoIssues,
  fetchRepoPulls,
  requestPullReviewers,
  updateGithubIssue,
  updateGithubPull,
} from "../../lib/github/github";
import {
  mapGithubIssueToTask,
  mapGithubMilestoneToTask,
} from "../../lib/github/map-github-issue";
import { mergeGithubMilestones } from "../../lib/github/merge-github-milestones";
import {
  buildBoardColumns,
  buildIssueStatusMap,
  findStatusField,
  NO_STATUS_COLUMN,
} from "../../lib/github/project-status";
import { resolveGithubBoardProjectId } from "../../lib/github/resolve-board-project";
import { ensureTaskSyncTargets } from "../../lib/tasks/ensure-task-sync-targets";
import type { NewTask } from "../../schema/task.model";
import { projects, tasks } from "../../schema/schema";

function sanitizeGithubTaskRows(
  milestoneRows: NewTask[],
  issueRows: NewTask[],
): { milestoneRows: NewTask[]; issueRows: NewTask[] } {
  const milestoneIds = new Set(milestoneRows.map((row) => row.id));

  return {
    milestoneRows,
    issueRows: issueRows.map((row) => ({
      ...row,
      parentId:
        row.parentId && milestoneIds.has(row.parentId) ? row.parentId : null,
    })),
  };
}

function formatSyncError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Sync failed";
  }

  const cause = "cause" in error ? error.cause : undefined;
  if (cause instanceof Error && cause.message.trim()) {
    return `${error.message}: ${cause.message}`;
  }

  return error.message;
}

type GithubAuthContext = {
  accessToken: string;
  githubLogin?: string | null;
  repoOwner?: string | null;
  repoName?: string | null;
};

/**
 * Resolves the GitHub credentials stored on a PROJECT (shared by all members).
 * Returns null if the requesting user is not a member of the project, or if the
 * project has no connected PAT (falling back to a configured test token).
 */
export async function resolveGithubAuth(
  c: Context<{ Bindings: Bindings }>,
  projectId: string,
  userId: string,
): Promise<GithubAuthContext | null> {
  try {
    const db = useDB(c);
    if (!(await userCanAccessProject(db, projectId, userId))) {
      return null;
    }

    const [project] = await db
      .select({
        githubPat: projects.githubPat,
        githubLogin: projects.githubLogin,
        repoOwner: projects.repoOwner,
        repoName: projects.repoName,
        isGithubDisconnected: projects.isGithubDisconnected,
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project?.githubPat && !project.isGithubDisconnected) {
      return {
        accessToken: project.githubPat,
        githubLogin: project.githubLogin,
        repoOwner: project.repoOwner,
        repoName: project.repoName,
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
    };
  } catch {
    return null;
  }
}

/** Reads `projectId` + `userId` from the query string. */
function identityFromQuery(c: Context<{ Bindings: Bindings }>) {
  return {
    projectId: c.req.query("projectId"),
    userId: c.req.query("userId"),
  };
}

/** Persists the active repo (and optional board id) on the project row. */
async function rememberProjectRepo(
  c: Context<{ Bindings: Bindings }>,
  projectId: string,
  owner: string,
  repo: string,
  githubProjectId?: string | null,
) {
  const db = useDB(c);
  await db
    .update(projects)
    .set({
      repoOwner: owner,
      repoName: repo,
      ...(githubProjectId !== undefined ? { githubProjectId } : {}),
    })
    .where(eq(projects.id, projectId));
}

export const getGithubStatus = async (c: Context<{ Bindings: Bindings }>) => {
  const { projectId, userId } = identityFromQuery(c);
  if (!projectId || !userId) {
    return c.json({ error: "projectId and userId are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, projectId, userId);
  if (!auth) {
    return c.json({ connected: false });
  }

  let githubProjectId: string | null = null;
  try {
    const db = useDB(c);
    const [project] = await db
      .select({ githubProjectId: projects.githubProjectId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    githubProjectId = project?.githubProjectId ?? null;
  } catch {
    // ignore
  }

  return c.json({
    connected: true,
    githubLogin: auth.githubLogin,
    repoOwner: auth.repoOwner,
    repoName: auth.repoName,
    githubProjectId,
  });
};

export const getGithubRepos = async (c: Context<{ Bindings: Bindings }>) => {
  const { projectId, userId } = identityFromQuery(c);
  if (!projectId || !userId) {
    return c.json({ error: "projectId and userId are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, projectId, userId);
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
  const { projectId, userId } = identityFromQuery(c);
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  if (!projectId || !userId || !owner || !repo) {
    return c.json({ error: "projectId, userId, owner, and repo are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, projectId, userId);
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
  const { projectId, userId } = identityFromQuery(c);
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const state = (c.req.query("state") as "open" | "closed" | "all") ?? "all";
  if (!projectId || !userId || !owner || !repo) {
    return c.json({ error: "projectId, userId, owner, and repo are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, projectId, userId);
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
  const { projectId, userId } = identityFromQuery(c);
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  if (!projectId || !userId || !owner || !repo) {
    return c.json({ error: "projectId, userId, owner, and repo are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, projectId, userId);
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
    projectId?: string;
    userId?: string;
    owner?: string;
    repo?: string;
    title?: string;
    body?: string;
  } | null;

  if (!body?.projectId || !body.userId || !body.owner || !body.repo || !body.title?.trim()) {
    return c.json({ error: "projectId, userId, owner, repo, and title are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, body.projectId, body.userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const issue = await createGithubIssue(
      auth.accessToken,
      body.owner,
      body.repo,
      body.title.trim(),
      body.body?.trim() ?? "",
    );

    await rememberProjectRepo(c, body.projectId, body.owner, body.repo);

    return c.json({ issue });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create issue";
    return c.json({ error: message }, 502);
  }
};

export const postGithubPull = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as {
    projectId?: string;
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
    !body?.projectId ||
    !body.userId ||
    !body.owner ||
    !body.repo ||
    !body.title?.trim() ||
    !body.head?.trim() ||
    !body.base?.trim()
  ) {
    return c.json(
      { error: "projectId, userId, owner, repo, title, head, and base are required" },
      400,
    );
  }

  const auth = await resolveGithubAuth(c, body.projectId, body.userId);
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

    await rememberProjectRepo(c, body.projectId, body.owner, body.repo);

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
  const { projectId, userId } = identityFromQuery(c);
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const number = parsePullNumber(c.req.query("number"));
  const err = requireParams(c, { projectId, userId, owner, repo, number: number ? String(number) : undefined });
  if (err) return err;

  const auth = await resolveGithubAuth(c, projectId!, userId!);
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
  const { projectId, userId } = identityFromQuery(c);
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const number = parsePullNumber(c.req.query("number"));
  const err = requireParams(c, { projectId, userId, owner, repo, number: number ? String(number) : undefined });
  if (err) return err;

  const auth = await resolveGithubAuth(c, projectId!, userId!);
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
  const { projectId, userId } = identityFromQuery(c);
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const number = parsePullNumber(c.req.query("number"));
  const err = requireParams(c, { projectId, userId, owner, repo, number: number ? String(number) : undefined });
  if (err) return err;

  const auth = await resolveGithubAuth(c, projectId!, userId!);
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
  const { projectId, userId } = identityFromQuery(c);
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const number = parsePullNumber(c.req.query("number"));
  const err = requireParams(c, { projectId, userId, owner, repo, number: number ? String(number) : undefined });
  if (err) return err;

  const auth = await resolveGithubAuth(c, projectId!, userId!);
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
  const { projectId, userId } = identityFromQuery(c);
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const sha = c.req.query("sha");
  const err = requireParams(c, { projectId, userId, owner, repo, sha });
  if (err) return err;

  const auth = await resolveGithubAuth(c, projectId!, userId!);
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
    projectId?: string;
    userId?: string;
    owner?: string;
    repo?: string;
    number?: number;
    body?: string;
  } | null;

  if (!body?.projectId || !body.userId || !body.owner || !body.repo || !body.number || !body.body?.trim()) {
    return c.json({ error: "projectId, userId, owner, repo, number, and body are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, body.projectId, body.userId);
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
    projectId?: string;
    userId?: string;
    owner?: string;
    repo?: string;
    number?: number;
    body?: string;
    event?: "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
  } | null;

  if (!body?.projectId || !body.userId || !body.owner || !body.repo || !body.number || !body.event) {
    return c.json({ error: "projectId, userId, owner, repo, number, and event are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, body.projectId, body.userId);
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
    projectId?: string;
    userId?: string;
    owner?: string;
    repo?: string;
    number?: number;
    title?: string;
    body?: string;
    state?: "open" | "closed";
    draft?: boolean;
  } | null;

  if (!body?.projectId || !body.userId || !body.owner || !body.repo || !body.number) {
    return c.json({ error: "projectId, userId, owner, repo, and number are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, body.projectId, body.userId);
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
    projectId?: string;
    userId?: string;
    owner?: string;
    repo?: string;
    number?: number;
    reviewers?: string[];
  } | null;

  if (!body?.projectId || !body.userId || !body.owner || !body.repo || !body.number || !body.reviewers?.length) {
    return c.json({ error: "projectId, userId, owner, repo, number, and reviewers are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, body.projectId, body.userId);
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
    projectId?: string;
    userId?: string;
    owner?: string;
    repo?: string;
    head?: string;
    base?: string;
  } | null;

  if (!body?.projectId || !body.userId || !body.owner || !body.repo || !body.head || !body.base) {
    return c.json({ error: "projectId, userId, owner, repo, head, and base are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, body.projectId, body.userId);
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
  const { projectId, userId } = identityFromQuery(c);
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const number = parsePullNumber(c.req.query("number"));
  const err = requireParams(c, { projectId, userId, owner, repo, number: number ? String(number) : undefined });
  if (err) return err;

  const auth = await resolveGithubAuth(c, projectId!, userId!);
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
  const { projectId, userId } = identityFromQuery(c);
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const number = parsePullNumber(c.req.query("number"));
  const err = requireParams(c, { projectId, userId, owner, repo, number: number ? String(number) : undefined });
  if (err) return err;

  const auth = await resolveGithubAuth(c, projectId!, userId!);
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
    projectId?: string;
    userId?: string;
    owner?: string;
    repo?: string;
    number?: number;
    body?: string;
  } | null;

  if (!body?.projectId || !body.userId || !body.owner || !body.repo || !body.number || !body.body?.trim()) {
    return c.json({ error: "projectId, userId, owner, repo, number, and body are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, body.projectId, body.userId);
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
    projectId?: string;
    userId?: string;
    owner?: string;
    repo?: string;
    number?: number;
    title?: string;
    body?: string;
    state?: "open" | "closed";
    labels?: string[];
    assignees?: string[];
    milestone?: number | null;
  } | null;

  if (!body?.projectId || !body.userId || !body.owner || !body.repo || !body.number) {
    return c.json({ error: "projectId, userId, owner, repo, and number are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, body.projectId, body.userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const issue = await updateGithubIssue(auth.accessToken, body.owner, body.repo, body.number, {
      title: body.title,
      body: body.body,
      state: body.state,
      labels: body.labels,
      assignees: body.assignees,
      milestone: body.milestone,
    });
    return c.json({ issue });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update issue";
    return c.json({ error: message }, 502);
  }
};

export const getGithubLabels = async (c: Context<{ Bindings: Bindings }>) => {
  const { projectId, userId } = identityFromQuery(c);
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const err = requireParams(c, { projectId, userId, owner, repo });
  if (err) return err;

  const auth = await resolveGithubAuth(c, projectId!, userId!);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const labels = await fetchRepoLabels(auth.accessToken, owner!, repo!);
    return c.json({ labels });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch labels";
    return c.json({ error: message }, 502);
  }
};

export const getGithubMilestones = async (c: Context<{ Bindings: Bindings }>) => {
  const { projectId, userId } = identityFromQuery(c);
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const err = requireParams(c, { projectId, userId, owner, repo });
  if (err) return err;

  const auth = await resolveGithubAuth(c, projectId!, userId!);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const milestones = await fetchRepoMilestones(auth.accessToken, owner!, repo!);
    return c.json({ milestones });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch milestones";
    return c.json({ error: message }, 502);
  }
};

export const postGithubMilestone = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as {
    projectId?: string;
    userId?: string;
    owner?: string;
    repo?: string;
    title?: string;
    description?: string;
    dueOn?: string;
  } | null;

  if (!body?.projectId || !body.userId || !body.owner || !body.repo || !body.title?.trim()) {
    return c.json({ error: "projectId, userId, owner, repo, and title are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, body.projectId, body.userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const milestone = await createRepoMilestone(auth.accessToken, body.owner, body.repo, {
      title: body.title.trim(),
      description: body.description,
      dueOn: body.dueOn,
    });
    return c.json({ milestone });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create milestone";
    return c.json({ error: message }, 502);
  }
};

export const getGithubAssignees = async (c: Context<{ Bindings: Bindings }>) => {
  const { projectId, userId } = identityFromQuery(c);
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const err = requireParams(c, { projectId, userId, owner, repo });
  if (err) return err;

  const auth = await resolveGithubAuth(c, projectId!, userId!);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const assignees = await fetchRepoAssignees(auth.accessToken, owner!, repo!);
    return c.json({ assignees });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch assignees";
    return c.json({ error: message }, 502);
  }
};

export const postGithubMergePull = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as {
    projectId?: string;
    userId?: string;
    owner?: string;
    repo?: string;
    number?: number;
    mergeMethod?: "merge" | "squash" | "rebase";
  } | null;

  if (!body?.projectId || !body.userId || !body.owner || !body.repo || !body.number) {
    return c.json({ error: "projectId, userId, owner, repo, and number are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, body.projectId, body.userId);
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
    projectId?: string;
    userId?: string;
    owner?: string;
    repo?: string;
    githubProjectId?: string;
  } | null;

  if (!body?.projectId || !body.userId || !body.owner || !body.repo) {
    return c.json({ error: "projectId, userId, owner, and repo are required" }, 400);
  }

  const db = useDB(c);
  if (!(await userCanAccessProject(db, body.projectId, body.userId))) {
    return c.json({ error: "Connect GitHub first" }, 401);
  }

  const [project] = await db
    .select({
      id: projects.id,
      workspaceId: projects.workspaceId,
      githubPat: projects.githubPat,
      githubProjectId: projects.githubProjectId,
      isGithubDisconnected: projects.isGithubDisconnected,
    })
    .from(projects)
    .where(eq(projects.id, body.projectId))
    .limit(1);

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  const accessToken =
    project.githubPat && !project.isGithubDisconnected
      ? project.githubPat
      : c.env.GITHUB_TEST_TOKEN?.trim();

  if (!accessToken) {
    return c.json({ error: "Connect GitHub first" }, 401);
  }

  try {
    const { owner, repo } = body;
    const { id: projectId, workspaceId } = project;
    await ensureTaskSyncTargets(db, projectId, workspaceId);

    const githubBoardProjectId = await resolveGithubBoardProjectId(
      accessToken,
      { githubProjectId: project.githubProjectId },
      owner,
      repo,
      body.githubProjectId,
    );

    let boardColumns: { id: string; name: string }[] = [];
    let issueStatusMap = new Map<number, { statusName: string; optionId: string }>();

    if (githubBoardProjectId) {
      const projectDetail = await fetchProjectDetail(
        accessToken,
        githubBoardProjectId,
      );
      const statusField = findStatusField(projectDetail.fields);
      boardColumns = buildBoardColumns(statusField);
      issueStatusMap = buildIssueStatusMap(projectDetail.items, statusField);

      if (boardColumns.length > 0) {
        boardColumns.push({ id: NO_STATUS_COLUMN, name: NO_STATUS_COLUMN });
      }
    }

    const [milestones, issues] = await Promise.all([
      fetchRepoMilestones(accessToken, owner, repo),
      fetchRepoIssues(accessToken, owner, repo),
    ]);

    const mergedMilestones = mergeGithubMilestones(milestones, issues);

    const milestoneRows = mergedMilestones.map((milestone) =>
      mapGithubMilestoneToTask(
        milestone,
        owner,
        repo,
        projectId,
        workspaceId,
      ),
    );
    const issueRows = issues.map((issue) => {
      const projectStatus = issueStatusMap.get(issue.number)?.statusName ?? null;
      return mapGithubIssueToTask(
        issue,
        owner,
        repo,
        projectId,
        workspaceId,
        projectStatus,
      );
    });

    const sanitized = sanitizeGithubTaskRows(milestoneRows, issueRows);
    const syncedIds = [...sanitized.milestoneRows, ...sanitized.issueRows].map(
      (row) => row.id,
    );

    if (syncedIds.length > 0) {
      await db.delete(tasks).where(inArray(tasks.id, syncedIds));
    }

    await db
      .delete(tasks)
      .where(and(eq(tasks.source, "github"), eq(tasks.projectId, projectId)));

    await runD1Statements(db, [
      ...sanitized.milestoneRows.map((row) => db.insert(tasks).values(row)),
      ...sanitized.issueRows.map((row) => db.insert(tasks).values(row)),
    ]);

    await db
      .update(projects)
      .set({
        repoOwner: owner,
        repoName: repo,
        githubProjectId: githubBoardProjectId,
      })
      .where(eq(projects.id, projectId));

    return c.json({
      synced: sanitized.milestoneRows.length + sanitized.issueRows.length,
      milestones: sanitized.milestoneRows.length,
      issues: sanitized.issueRows.length,
      projectId,
      githubProjectId: githubBoardProjectId,
      columns: boardColumns,
    });
  } catch (error) {
    const message = formatSyncError(error);
    return c.json({ error: message }, 502);
  }
};

export const postGithubPAT = async (c: Context<{ Bindings: Bindings }>) => {
  const { projectId, userId, token } = await c.req.json<{
    projectId: string;
    userId: string;
    token: string;
  }>();
  if (!projectId || !userId || !token) {
    return c.json({ error: "projectId, userId, and token are required" }, 400);
  }

  const db = useDB(c);
  if (!(await userCanAccessProject(db, projectId, userId))) {
    return c.json({ error: "You don't have access to this project" }, 403);
  }

  try {
    const githubLogin = await fetchGithubLogin(token);

    await db
      .update(projects)
      .set({
        githubPat: token,
        githubLogin,
        githubConnected: true,
        isGithubDisconnected: false,
        githubConnectedBy: userId,
      })
      .where(eq(projects.id, projectId));

    return c.json({ githubLogin });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid token or GitHub API error";
    return c.json({ error: message }, 400);
  }
};

export const postGithubDisconnect = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as {
    projectId?: string;
    userId?: string;
  } | null;
  if (!body?.projectId || !body.userId) {
    return c.json({ error: "projectId and userId are required" }, 400);
  }

  try {
    const db = useDB(c);
    if (!(await userCanAccessProject(db, body.projectId, body.userId))) {
      return c.json({ error: "You don't have access to this project" }, 403);
    }

    await db
      .update(projects)
      .set({
        githubPat: null,
        githubLogin: null,
        repoOwner: null,
        repoName: null,
        githubProjectId: null,
        githubConnectedBy: null,
        githubConnected: false,
        isGithubDisconnected: true,
      })
      .where(eq(projects.id, body.projectId));
    return c.json({ disconnected: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to disconnect";
    return c.json({ error: message }, 500);
  }
};

export const getGithubProjects = async (c: Context<{ Bindings: Bindings }>) => {
  const { projectId, userId } = identityFromQuery(c);
  const org = c.req.query("org");
  if (!projectId || !userId) {
    return c.json({ error: "projectId and userId are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, projectId, userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const [userProjects, orgProjects] = await Promise.all([
      fetchUserProjects(auth.accessToken),
      org ? fetchOrgProjects(auth.accessToken, org) : Promise.resolve([]),
    ]);
    return c.json({ projects: [...userProjects, ...orgProjects] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch projects";
    return c.json({ error: message }, 502);
  }
};

export const getGithubProjectDetail = async (c: Context<{ Bindings: Bindings }>) => {
  const { projectId, userId } = identityFromQuery(c);
  const githubProjectId = c.req.query("githubProjectId");
  if (!projectId || !userId || !githubProjectId) {
    return c.json({ error: "projectId, userId, and githubProjectId are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, projectId, userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const detail = await fetchProjectDetail(auth.accessToken, githubProjectId);
    return c.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch project";
    return c.json({ error: message }, 502);
  }
};

export const postGithubProjectItem = async (c: Context<{ Bindings: Bindings }>) => {
  const body = await c.req.json<{
    projectId: string;
    userId: string;
    githubProjectId: string;
    contentId?: string;
    title?: string;
    itemBody?: string;
  }>();
  const { projectId, userId, githubProjectId, contentId, title, itemBody } = body;
  if (!projectId || !userId || !githubProjectId) {
    return c.json({ error: "projectId, userId, and githubProjectId are required" }, 400);
  }
  if (!contentId && !title) return c.json({ error: "contentId or title required" }, 400);

  const auth = await resolveGithubAuth(c, projectId, userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    const itemId = contentId
      ? await addProjectItemById(auth.accessToken, githubProjectId, contentId)
      : await addProjectDraftItem(auth.accessToken, githubProjectId, title!, itemBody);
    return c.json({ itemId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add project item";
    return c.json({ error: message }, 502);
  }
};

export const patchGithubProjectItem = async (c: Context<{ Bindings: Bindings }>) => {
  const body = await c.req.json<{
    projectId: string;
    userId: string;
    githubProjectId: string;
    itemId: string;
    fieldId: string;
    value: ProjectFieldValue;
  }>();
  const { projectId, userId, githubProjectId, itemId, fieldId, value } = body;
  if (!projectId || !userId || !githubProjectId || !itemId || !fieldId || value === undefined) {
    return c.json({ error: "projectId, userId, githubProjectId, itemId, fieldId and value are required" }, 400);
  }

  const auth = await resolveGithubAuth(c, projectId, userId);
  if (!auth) return c.json({ error: "Connect GitHub first" }, 401);

  try {
    await updateProjectItemField(auth.accessToken, githubProjectId, itemId, fieldId, value);
    return c.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update project item";
    return c.json({ error: message }, 502);
  }
};
