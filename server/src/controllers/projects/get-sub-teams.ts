import type { Context } from "hono";
import { eq } from "drizzle-orm";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { userCanAccessProject } from "../../lib/projects/project-access";
import { subTeamMembers, subTeams, users } from "../../schema/schema";

export async function getSubTeams(
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

  const teams = await db
    .select()
    .from(subTeams)
    .where(eq(subTeams.projectId, projectId));

  const result = [];
  for (const team of teams) {
    const members = await db
      .select({
        userId: subTeamMembers.userId,
        email: users.email,
        name: users.name,
      })
      .from(subTeamMembers)
      .innerJoin(users, eq(subTeamMembers.userId, users.id))
      .where(eq(subTeamMembers.subTeamId, team.id));

    result.push({
      id: team.id,
      name: team.name,
      members: members.map((m) => ({
        userId: m.userId,
        email: m.email,
        name: m.name,
      })),
    });
  }

  return c.json({ subTeams: result });
}
