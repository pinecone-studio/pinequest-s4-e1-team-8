import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { Hono } from "hono";
import { resolveAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { userCanAccessProject } from "../../lib/projects/project-access";
import { projects, tasks } from "../../schema/schema";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

type SyncTarget = "github" | "asana";

type SyncTaskBody = {
  taskId: string;
  title: string;
  description: string;
  syncTargets: SyncTarget[];
};

type SyncPlatformResult = {
  platform: SyncTarget;
  success: boolean;
  remoteId?: string | number;
  error?: string;
};

function isValidSyncTaskBody(body: unknown): body is SyncTaskBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;

  if (typeof b.taskId !== "string" || !b.taskId.trim()) return false;
  if (typeof b.title !== "string" || !b.title.trim()) return false;
  if (typeof b.description !== "string") return false;
  if (!Array.isArray(b.syncTargets) || b.syncTargets.length === 0) return false;

  const validTargets: SyncTarget[] = ["github", "asana"];
  for (const t of b.syncTargets) {
    if (!validTargets.includes(t as SyncTarget)) return false;
  }

  return true;
}

async function markFailed(
  db: ReturnType<typeof useDB>,
  taskId: string,
): Promise<void> {
  try {
    await db.update(tasks).set({ syncState: "Failed" }).where(eq(tasks.id, taskId));
  } catch {
  }
}

const syncRoutes = new Hono<HonoEnv>();

syncRoutes.use(async (c, next) => {
  const userId = await resolveAuthenticatedUserId(c);
  if (!userId) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }
  c.set("userId", userId);
  await next();
});

syncRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!isValidSyncTaskBody(body)) {
    return c.json(
      {
        success: false,
        error:
          "Invalid payload. Required: taskId (string), title (string), description (string), syncTargets (Array<'github'|'asana'>)",
      },
      400,
    );
  }

  const { taskId, title, description, syncTargets } = body;
  const userId = c.get("userId");
  const db = useDB(c as unknown as Context<{ Bindings: Bindings }>);

  const [task] = await db
    .select({ id: tasks.id, projectId: tasks.projectId })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task) {
    return c.json({ success: false, error: "Task not found" }, 404);
  }

  if (task.projectId && !(await userCanAccessProject(db, task.projectId, userId))) {
    return c.json({ success: false, error: "Forbidden" }, 403);
  }

  // Credentials live on the task's project (shared by all members).
  const [project] = task.projectId
    ? await db
        .select({
          githubPat: projects.githubPat,
          repoOwner: projects.repoOwner,
          repoName: projects.repoName,
          isGithubDisconnected: projects.isGithubDisconnected,
          asanaAccessToken: projects.asanaAccessToken,
          asanaProjectGid: projects.asanaProjectGid,
          asanaWorkspaceGid: projects.asanaWorkspaceGid,
          isAsanaDisconnected: projects.isAsanaDisconnected,
        })
        .from(projects)
        .where(eq(projects.id, task.projectId))
        .limit(1)
    : [];

  const results: SyncPlatformResult[] = [];

  if (syncTargets.includes("github")) {
    try {
      if (!project?.githubPat || project.isGithubDisconnected) {
        results.push({
          platform: "github",
          success: false,
          error: "GitHub is not connected for this project",
        });
        await markFailed(db, taskId);
      } else if (!project.repoOwner || !project.repoName) {
        results.push({
          platform: "github",
          success: false,
          error: "GitHub integration is missing repository configuration",
        });
        await markFailed(db, taskId);
      } else {
        const { repoOwner: owner, repoName: repo } = project;

        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/issues`,
          {
            method: "POST",
            headers: {
              Accept: "application/vnd.github+json",
              "User-Agent": "brisk-app",
              Authorization: `Bearer ${project.githubPat}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ title, body: description }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text().catch(() => String(response.status));
          throw new Error(`GitHub API error (${response.status}): ${errorText}`);
        }

        const created = (await response.json()) as { number: number };

        results.push({ platform: "github", success: true, remoteId: created.number });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      results.push({ platform: "github", success: false, error: message });
      await markFailed(db, taskId);
    }
  }

  if (syncTargets.includes("asana")) {
    try {
      if (!project?.asanaAccessToken || project.isAsanaDisconnected) {
        results.push({
          platform: "asana",
          success: false,
          error: "Asana is not connected for this project",
        });
        await markFailed(db, taskId);
      } else if (!project.asanaProjectGid && !project.asanaWorkspaceGid) {
        results.push({
          platform: "asana",
          success: false,
          error: "Asana integration is missing project or workspace configuration",
        });
        await markFailed(db, taskId);
      } else {
        const payload: Record<string, unknown> = { name: title, notes: description };

        if (project.asanaProjectGid) {
          payload.projects = [project.asanaProjectGid];
        } else {
          payload.workspace = project.asanaWorkspaceGid;
        }

        const response = await fetch("https://app.asana.com/api/1.0/tasks", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${project.asanaAccessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ data: payload }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => String(response.status));
          throw new Error(`Asana API error (${response.status}): ${errorText}`);
        }

        const envelope = (await response.json()) as { data: { gid: string } };

        results.push({ platform: "asana", success: true, remoteId: envelope.data.gid });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      results.push({ platform: "asana", success: false, error: message });
      await markFailed(db, taskId);
    }
  }

  const allSucceeded = results.every((r) => r.success);

  if (allSucceeded) {
    await db.update(tasks).set({ syncState: "Synced" }).where(eq(tasks.id, taskId));
  }

  return c.json({
    success: true,
    taskId,
    syncState: allSucceeded ? "Synced" : "Failed",
    results,
  });
});

export default syncRoutes;
