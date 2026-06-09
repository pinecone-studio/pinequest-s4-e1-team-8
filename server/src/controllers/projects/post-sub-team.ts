import type { Context } from "hono";
import { nanoid } from "nanoid";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { userCanAccessProject } from "../../lib/projects/project-access";
import { subTeams } from "../../schema/schema";

export async function postSubTeam(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) {
  const userId = await getAuthenticatedUserId(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const projectId = c.req.param("projectId");
  if (!projectId) {
    return c.json({ error: "projectId is required" }, 400);
  }
  const db = useDB(c);

  const allowed = await userCanAccessProject(db, projectId, userId);
  if (!allowed) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = (await c.req.json().catch(() => null)) as { name?: string } | null;
  const name = body?.name?.trim();
  if (!name) {
    return c.json({ error: "name is required" }, 400);
  }

  const id = `team_${nanoid(10)}`;
  const [row] = await db
    .insert(subTeams)
    .values({ id, projectId, name })
    .returning();

  return c.json({ subTeam: { ...row, members: [] } }, 201);
}
