import type { Context } from "hono";
import { asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { userCanAccessProject } from "../../lib/projects/project-access";
import { projectResources } from "../../schema/schema";

export async function getProjectResources(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) {
  const userId = await getAuthenticatedUserId(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const projectId = c.req.param("projectId")?.trim();
  if (!projectId) {
    return c.json({ error: "projectId is required" }, 400);
  }

  const db = useDB(c);
  const allowed = await userCanAccessProject(db, projectId, userId);
  if (!allowed) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const rows = await db
    .select({
      id: projectResources.id,
      name: projectResources.name,
      url: projectResources.url,
    })
    .from(projectResources)
    .where(eq(projectResources.projectId, projectId))
    .orderBy(asc(projectResources.sortOrder));

  return c.json({ resources: rows });
}

type PutResourcesBody = {
  resources?: unknown;
};

export async function putProjectResources(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) {
  const userId = await getAuthenticatedUserId(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const projectId = c.req.param("projectId")?.trim();
  if (!projectId) {
    return c.json({ error: "projectId is required" }, 400);
  }

  const db = useDB(c);
  const allowed = await userCanAccessProject(db, projectId, userId);
  if (!allowed) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = (await c.req.json().catch(() => null)) as PutResourcesBody | null;
  const rawResources = Array.isArray(body?.resources) ? body.resources : [];

  const resources = rawResources
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object")
    .map((entry) => ({
      id: typeof entry.id === "string" ? entry.id : `res_${nanoid(10)}`,
      name: typeof entry.name === "string" ? entry.name.trim() : "",
      url: typeof entry.url === "string" ? entry.url.trim() : "",
    }))
    .filter((entry) => entry.name && entry.url);

  await db
    .delete(projectResources)
    .where(eq(projectResources.projectId, projectId));

  for (const [index, resource] of resources.entries()) {
    await db.insert(projectResources).values({
      id: resource.id.startsWith("res_") ? resource.id : `res_${nanoid(10)}`,
      projectId,
      name: resource.name,
      url: resource.url,
      sortOrder: index,
    });
  }

  return c.json({ ok: true, resources });
}
