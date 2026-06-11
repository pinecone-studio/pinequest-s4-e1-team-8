import { and, eq } from "drizzle-orm";
import { Context } from "hono";
import { mapAsanaTaskToTask } from "../../lib/asana/map-asana-task";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { userCanAccessProject } from "../../lib/projects/project-access";
import { ensureTaskDefaults } from "../../lib/tasks/ensure-task-defaults";
import { DEFAULT_WORKSPACE_ID } from "../../lib/tasks/task-defaults";
import { projects, tasks } from "../../schema/schema";
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
  workspaceGid?: string | null;
  projectGid?: string | null;
  projectName?: string | null;
  asanaUserName?: string | null;
};

/**
 * Resolves the Asana credentials stored on a PROJECT (shared by all members),
 * refreshing the access token in place when it is close to expiry. Returns null
 * if the requesting user is not a member, or the project has no connection
 * (falling back to a configured test token).
 */
export async function resolveAsanaAuth(
  c: Context<{ Bindings: Bindings }>,
  projectId: string,
  userId: string,
): Promise<AsanaAuthContext | null> {
  try {
    const db = useDB(c);
    if (!(await userCanAccessProject(db, projectId, userId))) {
      return null;
    }

    const [project] = await db
      .select({
        asanaAccessToken: projects.asanaAccessToken,
        asanaRefreshToken: projects.asanaRefreshToken,
        asanaTokenExpiresAt: projects.asanaTokenExpiresAt,
        asanaWorkspaceGid: projects.asanaWorkspaceGid,
        asanaProjectGid: projects.asanaProjectGid,
        asanaProjectName: projects.asanaProjectName,
        asanaUserName: projects.asanaUserName,
        isAsanaDisconnected: projects.isAsanaDisconnected,
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project?.asanaAccessToken || project.isAsanaDisconnected) {
      const testToken = c.env.ASANA_TEST_TOKEN?.trim();
      if (!testToken) return null;
      return { accessToken: testToken };
    }

    let accessToken = project.asanaAccessToken;
    const expiresAt = project.asanaTokenExpiresAt?.getTime() ?? 0;
    const asanaClientId = c.env.ASANA_CLIENT_ID;
    const asanaClientSecret = c.env.ASANA_CLIENT_SECRET;
    const shouldRefresh =
      Boolean(project.asanaRefreshToken) &&
      Boolean(asanaClientId) &&
      Boolean(asanaClientSecret) &&
      (!expiresAt || expiresAt <= Date.now() + 5 * 60 * 1000);

    if (
      shouldRefresh &&
      project.asanaRefreshToken &&
      asanaClientId &&
      asanaClientSecret
    ) {
      const refreshed = await refreshAsanaToken(
        project.asanaRefreshToken,
        asanaClientId,
        asanaClientSecret,
      );

      accessToken = refreshed.access_token;
      await db
        .update(projects)
        .set({
          asanaAccessToken: refreshed.access_token,
          asanaRefreshToken: refreshed.refresh_token ?? project.asanaRefreshToken,
          asanaTokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        })
        .where(eq(projects.id, projectId));
    }

    return {
      accessToken,
      workspaceGid: project.asanaWorkspaceGid,
      projectGid: project.asanaProjectGid,
      projectName: project.asanaProjectName,
      asanaUserName: project.asanaUserName,
    };
  } catch {
    const testToken = c.env.ASANA_TEST_TOKEN?.trim();
    if (!testToken) return null;
    return { accessToken: testToken };
  }
}

export const getAsanaStatus = async (c: Context<{ Bindings: Bindings }>) => {
  const projectId = c.req.query("projectId");
  const userId = c.req.query("userId");
  if (!projectId || !userId) {
    return c.json({ error: "projectId and userId are required" }, 400);
  }

  const auth = await resolveAsanaAuth(c, projectId, userId);
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
    projectId?: string;
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    asanaUserGid?: string | null;
    asanaUserName?: string | null;
    asanaUserEmail?: string | null;
  } | null;

  if (!body?.projectId || !body.userId || !body.accessToken) {
    return c.json({ error: "projectId, userId, and accessToken are required" }, 400);
  }

  const db = useDB(c);
  if (!(await userCanAccessProject(db, body.projectId, body.userId))) {
    return c.json({ error: "You don't have access to this project" }, 403);
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

    await db
      .update(projects)
      .set({
        asanaAccessToken: body.accessToken,
        asanaRefreshToken: body.refreshToken ?? null,
        asanaTokenExpiresAt: body.expiresIn
          ? new Date(Date.now() + body.expiresIn * 1000)
          : null,
        asanaUserGid: profile.gid,
        asanaUserName: profile.name,
        asanaUserEmail: profile.email,
        asanaConnected: true,
        isAsanaDisconnected: false,
        asanaConnectedBy: body.userId,
      })
      .where(eq(projects.id, body.projectId));

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

    const [project] = await db
      .select({ asanaAccessToken: projects.asanaAccessToken })
      .from(projects)
      .where(eq(projects.id, body.projectId))
      .limit(1);

    if (project?.asanaAccessToken) {
      try {
        await revokeAsanaToken(project.asanaAccessToken);
      } catch {
        // Token may already be invalid — still remove local record.
      }
    }

    await db
      .update(projects)
      .set({
        asanaAccessToken: null,
        asanaRefreshToken: null,
        asanaTokenExpiresAt: null,
        asanaUserGid: null,
        asanaUserName: null,
        asanaUserEmail: null,
        asanaWorkspaceGid: null,
        asanaProjectGid: null,
        asanaProjectName: null,
        asanaConnectedBy: null,
        asanaConnected: false,
        isAsanaDisconnected: true,
      })
      .where(eq(projects.id, body.projectId));

    return c.json({ disconnected: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to disconnect Asana";
    return c.json({ error: message }, 500);
  }
};

export const getAsanaWorkspaces = async (c: Context<{ Bindings: Bindings }>) => {
  const projectId = c.req.query("projectId");
  const userId = c.req.query("userId");
  if (!projectId || !userId) {
    return c.json({ error: "projectId and userId are required" }, 400);
  }

  const auth = await resolveAsanaAuth(c, projectId, userId);
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
  const projectId = c.req.query("projectId");
  const userId = c.req.query("userId");
  const workspaceGid = c.req.query("workspaceGid");
  if (!projectId || !userId || !workspaceGid) {
    return c.json({ error: "projectId, userId, and workspaceGid are required" }, 400);
  }

  const auth = await resolveAsanaAuth(c, projectId, userId);
  if (!auth) return c.json({ error: "Connect Asana first" }, 401);

  try {
    const asanaProjects = await getProjects(auth.accessToken, workspaceGid);
    return c.json({
      projects: asanaProjects.filter((project) => !project.archived),
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
    projectId?: string;
    userId?: string;
    workspaceGid?: string;
    asanaProjectGid?: string;
    asanaProjectName?: string;
  } | null;

  if (!body?.projectId || !body.userId || !body.workspaceGid || !body.asanaProjectGid) {
    return c.json(
      { error: "projectId, userId, workspaceGid, and asanaProjectGid are required" },
      400,
    );
  }

  const db = useDB(c);
  if (!(await userCanAccessProject(db, body.projectId, body.userId))) {
    return c.json({ error: "You don't have access to this project" }, 403);
  }

  await db
    .update(projects)
    .set({
      asanaWorkspaceGid: body.workspaceGid,
      asanaProjectGid: body.asanaProjectGid,
      asanaProjectName: body.asanaProjectName ?? null,
    })
    .where(eq(projects.id, body.projectId));

  return c.json({
    workspaceGid: body.workspaceGid,
    projectGid: body.asanaProjectGid,
    projectName: body.asanaProjectName ?? null,
  });
};

export const postAsanaSync = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as {
    projectId?: string;
    userId?: string;
  } | null;
  if (!body?.projectId || !body.userId) {
    return c.json({ error: "projectId and userId are required" }, 400);
  }

  const auth = await resolveAsanaAuth(c, body.projectId, body.userId);
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
