import type { Context } from "hono";
import { eq } from "drizzle-orm";
import type { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { projects, users } from "../../schema/schema";

export async function getInvitePreview(c: Context<{ Bindings: Bindings }>) {
  const token = c.req.param("token");
  if (!token) {
    return c.json({ error: "token is required" }, 400);
  }
  const db = useDB(c);

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.inviteToken, token))
    .limit(1);

  if (!project) {
    return c.json({ error: "Invite not found or expired" }, 404);
  }

  const owner = project.ownerId
    ? await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, project.ownerId))
        .limit(1)
        .then((rows) => rows[0] ?? null)
    : null;

  return c.json({
    projectId: project.id,
    projectName: project.name,
    description: project.description,
    ownerName: owner?.name ?? "Project owner",
  });
}
