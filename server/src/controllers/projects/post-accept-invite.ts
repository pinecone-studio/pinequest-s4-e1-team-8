import type { Context } from "hono";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { userCanAccessProject } from "../../lib/projects/project-access";
import {
  projectCollaborators,
  projects,
  users,
} from "../../schema/schema";

export async function postAcceptInvite(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) {
  const userId = await getAuthenticatedUserId(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

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

  const alreadyMember = await userCanAccessProject(db, project.id, userId);
  if (alreadyMember) {
    return c.json({ projectId: project.id, alreadyMember: true });
  }

  const [user] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.email) {
    return c.json({ error: "User email not found" }, 400);
  }

  const email = user.email.toLowerCase();

  const [pending] = await db
    .select()
    .from(projectCollaborators)
    .where(
      and(
        eq(projectCollaborators.projectId, project.id),
        sql`lower(${projectCollaborators.email}) = ${email}`,
      ),
    )
    .limit(1);

  if (!pending) {
    await db.insert(projectCollaborators).values({
      id: `collab_${nanoid(10)}`,
      projectId: project.id,
      email: user.email,
      role: "Developer",
    });
  }

  return c.json({
    projectId: project.id,
    projectName: project.name,
    alreadyMember: false,
  });
}
