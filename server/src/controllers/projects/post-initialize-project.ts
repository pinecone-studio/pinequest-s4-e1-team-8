import type { Context } from "hono";
import { eq } from "drizzle-orm";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { initializeProject } from "../../lib/projects/initialize-project.service";
import { validateInitializeProject } from "../../lib/projects/validate-initialize-project";
import { projectCollaborators } from "../../schema/schema";

export async function postInitializeProject(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) {
  const userId = await getAuthenticatedUserId(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const validation = validateInitializeProject(body);
  if (!validation.ok) {
    return c.json({ error: validation.error }, 400);
  }

  const db = useDB(c);
  const { project, projectId, workspaceId, inviteToken } =
    await initializeProject(db, userId, validation.data);

  const collaborators = await db
    .select()
    .from(projectCollaborators)
    .where(eq(projectCollaborators.projectId, projectId));

  return c.json({
    project: {
      id: project?.id ?? projectId,
      workspaceId,
      name: project?.name ?? validation.data.step1.projectName,
      description: project?.description ?? null,
      timezone: project?.timezone ?? null,
      inviteToken,
      githubConnected: project?.githubConnected ?? false,
      asanaConnected: project?.asanaConnected ?? false,
    },
    members: collaborators.map((row) => ({
      email: row.email,
      role: row.role,
    })),
  });
}
