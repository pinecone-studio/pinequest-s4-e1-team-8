import { and, eq } from "drizzle-orm";
import { Context } from "hono";
import { nanoid } from "nanoid";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import {
  buildGithubAuthorizeUrl,
  decodeOAuthState,
  exchangeGithubCode,
  fetchGithubLogin,
  fetchRepoIssues,
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
    return c.json({ error: message }, 500);
  }
};

export const getGithubCallback = async (c: Context<{ Bindings: Bindings }>) => {
  const code = c.req.query("code");
  const stateParam = c.req.query("state");

  if (c.req.query("error") || !code || !stateParam) {
    return c.redirect(`${appUrl(c.env)}/tasks`);
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

    return c.redirect(`${appUrl(c.env)}/tasks`);
  } catch {
    return c.redirect(`${appUrl(c.env)}/tasks`);
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
