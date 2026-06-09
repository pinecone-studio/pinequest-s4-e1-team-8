import type { Context } from "hono";
import { eq, inArray } from "drizzle-orm";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { listAccessibleProjectIds } from "../../lib/projects/project-access";
import {
  projectCollaborators,
  projects,
  users,
} from "../../schema/schema";

export async function getMyProjects(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) {
  const userId = await getAuthenticatedUserId(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = useDB(c);
  const projectIds = await listAccessibleProjectIds(db, userId);

  if (projectIds.length === 0) {
    return c.json({ projects: [] });
  }

  const rows = await db
    .select()
    .from(projects)
    .where(inArray(projects.id, projectIds));

  const allCollaborators = await db
    .select()
    .from(projectCollaborators)
    .where(inArray(projectCollaborators.projectId, projectIds));

  const [owner] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const ownerIds = rows
    .map((row) => row.ownerId)
    .filter((id): id is string => Boolean(id));

  const ownerRows =
    ownerIds.length > 0
      ? await db
          .select({ id: users.id, email: users.email, name: users.name })
          .from(users)
          .where(inArray(users.id, ownerIds))
      : [];

  const ownerById = new Map(ownerRows.map((row) => [row.id, row]));

  const projectsPayload = rows.map((project) => {
    const collaborators = allCollaborators
      .filter((c) => c.projectId === project.id)
      .map((c) => ({
        email: c.email,
        role: c.role as "Developer" | "Designer" | "Manager",
        name: c.email.split("@")[0] ?? c.email,
      }));

    const owner = project.ownerId ? ownerById.get(project.ownerId) : null;
    const members = owner
      ? [
          {
            email: owner.email,
            role: "Manager" as const,
            name: owner.name,
          },
          ...collaborators.filter(
            (c) => c.email.toLowerCase() !== owner.email.toLowerCase(),
          ),
        ]
      : collaborators;

    return {
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      description: project.description,
      timezone: project.timezone,
      inviteToken: project.inviteToken,
      githubConnected: project.githubConnected,
      asanaConnected: project.asanaConnected,
      isOwner: project.ownerId === userId,
      members,
    };
  });

  return c.json({
    projects: projectsPayload,
    currentUser: owner
      ? { email: owner.email, name: owner.name }
      : null,
  });
}
