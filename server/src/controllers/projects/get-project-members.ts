import type { Context } from "hono";
import { eq, sql } from "drizzle-orm";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { userCanAccessProject } from "../../lib/projects/project-access";
import {
  projectCollaborators,
  projects,
  users,
} from "../../schema/schema";

export async function getProjectMembers(
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

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  const collaborators = await db
    .select()
    .from(projectCollaborators)
    .where(eq(projectCollaborators.projectId, projectId));

  const owner = project.ownerId
    ? await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, project.ownerId))
        .limit(1)
        .then((rows) => rows[0] ?? null)
    : null;

  const memberEmails = new Set<string>();
  const members: Array<{
    email: string;
    name: string;
    role: string;
    isOwner: boolean;
  }> = [];

  if (owner) {
    memberEmails.add(owner.email.toLowerCase());
    members.push({
      email: owner.email,
      name: owner.name,
      role: "Manager",
      isOwner: true,
    });
  }

  for (const collaborator of collaborators) {
    const email = collaborator.email.toLowerCase();
    if (memberEmails.has(email)) {
      continue;
    }
    memberEmails.add(email);
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);

    members.push({
      email: collaborator.email,
      name: user?.name ?? collaborator.email.split("@")[0] ?? collaborator.email,
      role: collaborator.role,
      isOwner: false,
    });
  }

  return c.json({
    projectId,
    projectName: project.name,
    inviteToken: project.inviteToken,
    members,
  });
}
