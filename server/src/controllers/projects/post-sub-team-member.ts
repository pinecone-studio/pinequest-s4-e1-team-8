import type { Context } from "hono";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { userCanAccessProject } from "../../lib/projects/project-access";
import { subTeamMembers, subTeams, users } from "../../schema/schema";

export async function postSubTeamMember(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) {
  const userId = await getAuthenticatedUserId(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const subTeamId = c.req.param("subTeamId");
  if (!subTeamId) {
    return c.json({ error: "subTeamId is required" }, 400);
  }
  const db = useDB(c);

  const [team] = await db
    .select()
    .from(subTeams)
    .where(eq(subTeams.id, subTeamId))
    .limit(1);

  if (!team) {
    return c.json({ error: "Sub-team not found" }, 404);
  }

  const allowed = await userCanAccessProject(db, team.projectId, userId);
  if (!allowed) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = (await c.req.json().catch(() => null)) as
    | { userId?: string; email?: string }
    | null;
  const memberUserId = body?.userId?.trim();
  const memberEmail = body?.email?.trim().toLowerCase();

  if (!memberUserId && !memberEmail) {
    return c.json({ error: "userId or email is required" }, 400);
  }

  const [memberUser] = memberUserId
    ? await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, memberUserId))
        .limit(1)
    : await db
        .select({ id: users.id })
        .from(users)
        .where(sql`lower(${users.email}) = ${memberEmail}`)
        .limit(1);

  if (!memberUser) {
    return c.json({ error: "User not found" }, 404);
  }

  const [existing] = await db
    .select({ id: subTeamMembers.id })
    .from(subTeamMembers)
    .where(
      and(
        eq(subTeamMembers.subTeamId, subTeamId),
        eq(subTeamMembers.userId, memberUser.id),
      ),
    )
    .limit(1);

  if (existing) {
    return c.json({ ok: true, alreadyMember: true });
  }

  await db.insert(subTeamMembers).values({
    id: `stm_${nanoid(10)}`,
    subTeamId,
    userId: memberUser.id,
  });

  return c.json({ ok: true, alreadyMember: false }, 201);
}
