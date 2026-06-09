import { and, eq } from "drizzle-orm";
import { Context } from "hono";
import { nanoid } from "nanoid";
import { mapAsanaTaskToTask } from "../../lib/asana/map-asana-task";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { ensureTaskDefaults } from "../../lib/tasks/ensure-task-defaults";
import { DEFAULT_WORKSPACE_ID } from "../../lib/tasks/task-defaults";
import { asanaIntegrations, tasks, users } from "../../schema/schema";
import {
  getCurrentUser,
  getProjectTasks,
  getProjects,
  getWorkspaces,
  refreshAsanaToken,
  revokeAsanaToken,
} from "../../services/asana";

type AsanaAuthContext = {
  accessToken: string;
  integrationId: string;
  workspaceGid?: string | null;
  projectGid?: string | null;
  projectName?: string | null;
  asanaUserName?: string | null;
};

async function resolveAsanaAuth(
  c: Context<{ Bindings: Bindings }>,
  userId: string,
): Promise<AsanaAuthContext | null> {
  try {
    const db = useDB(c);
    const [integration] = await db
      .select()
      .from(asanaIntegrations)
      .where(eq(asanaIntegrations.userId, userId))
      .limit(1);

    if (!integration) {
      const testToken = c.env.ASANA_TEST_TOKEN?.trim();
      if (!testToken) return null;
      return {
        accessToken: testToken,
        integrationId: "test",
      };
    }

    let accessToken = integration.accessToken;
    const expiresAt = integration.tokenExpiresAt?.getTime() ?? 0;
    const asanaClientId = c.env.ASANA_CLIENT_ID;
    const asanaClientSecret = c.env.ASANA_CLIENT_SECRET;
    const shouldRefresh =
      Boolean(integration.refreshToken) &&
      Boolean(asanaClientId) &&
      Boolean(asanaClientSecret) &&
      (!expiresAt || expiresAt <= Date.now() + 5 * 60 * 1000);

    if (
      shouldRefresh &&
      integration.refreshToken &&
      asanaClientId &&
      asanaClientSecret
    ) {
      const refreshed = await refreshAsanaToken(
        integration.refreshToken,
        asanaClientId,
        asanaClientSecret,
      );

      accessToken = refreshed.access_token;
      await db
        .update(asanaIntegrations)
        .set({
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token ?? integration.refreshToken,
          tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        })
        .where(eq(asanaIntegrations.id, integration.id));
    }

    return {
      accessToken,
      integrationId: integration.id,
      workspaceGid: integration.workspaceGid,
      projectGid: integration.projectGid,
      projectName: integration.projectName,
      asanaUserName: integration.asanaUserName,
    };
  } catch {
    const testToken = c.env.ASANA_TEST_TOKEN?.trim();
    if (!testToken) return null;
    return {
      accessToken: testToken,
      integrationId: "test",
    };
  }
}

export const getAsanaStatus = async (c: Context<{ Bindings: Bindings }>) => {
  const userId = c.req.query("userId");
  if (!userId) return c.json({ error: "userId is required" }, 400);

  const auth = await resolveAsanaAuth(c, userId);
  if (!auth) {
    return c.json({ connected: false });
  }

  return c.json({
    connected: true,
    asanaUserName: auth.asanaUserName,
    workspaceGid: auth.workspaceGid,
    projectGid: auth.projectGid,
    projectName: auth.projectName,
  });
};

export const postAsanaOAuthComplete = async (
  c: Context<{ Bindings: Bindings }>,
) => {
  const body = (await c.req.json().catch(() => null)) as {
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    asanaUserGid?: string | null;
    asanaUserName?: string | null;
    asanaUserEmail?: string | null;
  } | null;

  if (!body?.userId || !body.accessToken) {
    return c.json({ error: "userId and accessToken are required" }, 400);
  }

  try {
    let profile = {
      gid: body.asanaUserGid ?? null,
      name: body.asanaUserName ?? null,
      email: body.asanaUserEmail ?? null,
    };

    if (!profile.gid || !profile.name) {
      try {
        const fetched = await getCurrentUser(body.accessToken);
        profile = {
          gid: fetched.gid,
          name: fetched.name,
          email: fetched.email ?? null,
        };
      } catch {
        // Token is still valid without profile metadata.
      }
    }

    const db = useDB(c);

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, body.userId))
      .limit(1);

    if (!existingUser) {
      await db.insert(users).values({
        id: body.userId,
        clerkId: `clerk_${body.userId}`,
        email: body.asanaUserEmail ?? `${body.userId}@local.dev`,
        name: body.asanaUserName ?? body.userId,
      });
    }

    const [existing] = await db
      .select({ id: asanaIntegrations.id })
      .from(asanaIntegrations)
      .where(eq(asanaIntegrations.userId, body.userId))
      .limit(1);

    const values = {
      accessToken: body.accessToken,
      refreshToken: body.refreshToken ?? null,
      tokenExpiresAt: body.expiresIn
        ? new Date(Date.now() + body.expiresIn * 1000)
        : null,
      asanaUserGid: profile.gid,
      asanaUserName: profile.name,
      asanaUserEmail: profile.email,
    };

    if (existing) {
      await db
        .update(asanaIntegrations)
        .set(values)
        .where(eq(asanaIntegrations.id, existing.id));
    } else {
      await db.insert(asanaIntegrations).values({
        id: `asana-int-${nanoid(10)}`,
        userId: body.userId,
        ...values,
      });
    }

    return c.json({
      asanaUserName: profile.name ?? "Asana user",
      asanaUserGid: profile.gid,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save Asana connection";
    return c.json({ error: message }, 400);
  }
};

export const postAsanaDisconnect = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as { userId?: string } | null;
  if (!body?.userId) return c.json({ error: "userId is required" }, 400);

  try {
    const db = useDB(c);
    const [integration] = await db
      .select()
      .from(asanaIntegrations)
      .where(eq(asanaIntegrations.userId, body.userId))
      .limit(1);

    if (integration) {
      try {
        await revokeAsanaToken(integration.accessToken);
      } catch {
        // Token may already be invalid — still remove local record.
      }
      await db
        .delete(asanaIntegrations)
        .where(eq(asanaIntegrations.userId, body.userId));
    }

    return c.json({ disconnected: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to disconnect Asana";
    return c.json({ error: message }, 500);
  }
};

export const getAsanaWorkspaces = async (c: Context<{ Bindings: Bindings }>) => {
  const userId = c.req.query("userId");
  if (!userId) return c.json({ error: "userId is required" }, 400);

  const auth = await resolveAsanaAuth(c, userId);
  if (!auth) return c.json({ error: "Connect Asana first" }, 401);

  try {
    const workspaces = await getWorkspaces(auth.accessToken);
    return c.json({ workspaces });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch workspaces";
    return c.json({ error: message }, 502);
  }
};

export const getAsanaProjects = async (c: Context<{ Bindings: Bindings }>) => {
  const userId = c.req.query("userId");
  const workspaceGid = c.req.query("workspaceGid");
  if (!userId || !workspaceGid) {
    return c.json({ error: "userId and workspaceGid are required" }, 400);
  }

  const auth = await resolveAsanaAuth(c, userId);
  if (!auth) return c.json({ error: "Connect Asana first" }, 401);

  try {
    const projects = await getProjects(auth.accessToken, workspaceGid);
    return c.json({
      projects: projects.filter((project) => !project.archived),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch projects";
    return c.json({ error: message }, 502);
  }
};

export const postAsanaSelectProject = async (
  c: Context<{ Bindings: Bindings }>,
) => {
  const body = (await c.req.json().catch(() => null)) as {
    userId?: string;
    workspaceGid?: string;
    projectGid?: string;
    projectName?: string;
  } | null;

  if (!body?.userId || !body.workspaceGid || !body.projectGid) {
    return c.json(
      { error: "userId, workspaceGid, and projectGid are required" },
      400,
    );
  }

  const db = useDB(c);
  const [integration] = await db
    .select({ id: asanaIntegrations.id })
    .from(asanaIntegrations)
    .where(eq(asanaIntegrations.userId, body.userId))
    .limit(1);

  if (!integration) {
    return c.json({ error: "Connect Asana first" }, 401);
  }

  await db
    .update(asanaIntegrations)
    .set({
      workspaceGid: body.workspaceGid,
      projectGid: body.projectGid,
      projectName: body.projectName ?? null,
    })
    .where(eq(asanaIntegrations.id, integration.id));

  return c.json({
    workspaceGid: body.workspaceGid,
    projectGid: body.projectGid,
    projectName: body.projectName ?? null,
  });
};

export const postAsanaSync = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as { userId?: string } | null;
  if (!body?.userId) return c.json({ error: "userId is required" }, 400);

  const auth = await resolveAsanaAuth(c, body.userId);
  if (!auth) return c.json({ error: "Connect Asana first" }, 401);

  if (!auth.projectGid) {
    return c.json({ error: "Select an Asana project first" }, 400);
  }

  try {
    const asanaTasks = await getProjectTasks(auth.accessToken, auth.projectGid);
    const rows = asanaTasks.map((task) =>
      mapAsanaTaskToTask(task, auth.projectGid!, auth.projectName ?? "Asana"),
    );

    const db = useDB(c);
    await ensureTaskDefaults(db);

    const existingRows = await db
      .select()
      .from(tasks)
      .where(
        and(eq(tasks.source, "asana"), eq(tasks.workspaceId, DEFAULT_WORKSPACE_ID)),
      );
    const existingById = new Map(existingRows.map((row) => [row.id, row]));
    const syncedIds = new Set<string>();

    for (const mapped of rows) {
      syncedIds.add(mapped.id);
      const existing = existingById.get(mapped.id);
      const status =
        mapped.status === "DONE" ? "DONE" : (existing?.status ?? mapped.status);

      if (existing) {
        await db
          .update(tasks)
          .set({
            title: mapped.title,
            description: mapped.description,
            dueDate: mapped.dueDate,
            status,
            tool: mapped.tool,
            membersJson: mapped.membersJson,
            progress: status === "DONE" ? 100 : existing.progress,
            doneCount: status === "DONE" ? 1 : existing.doneCount,
            timeLeft: mapped.timeLeft,
          })
          .where(eq(tasks.id, mapped.id));
      } else {
        await db.insert(tasks).values({ ...mapped, status });
      }
    }

    for (const existing of existingRows) {
      if (!syncedIds.has(existing.id)) {
        await db.delete(tasks).where(eq(tasks.id, existing.id));
      }
    }

    return c.json({ synced: rows.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return c.json({ error: message }, 502);
  }
};
