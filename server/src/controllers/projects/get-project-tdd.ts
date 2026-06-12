import type { Context } from "hono";
import { desc, eq } from "drizzle-orm";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { parseTddLayoutState } from "../../lib/onboarding/tdd-types";
import { userCanAccessProject } from "../../lib/projects/project-access";
import { onboardingSessions } from "../../schema/onboarding-session.model";

export async function getProjectTdd(
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

  const [session] = await db
    .select()
    .from(onboardingSessions)
    .where(eq(onboardingSessions.projectId, projectId))
    .orderBy(desc(onboardingSessions.createdAt))
    .limit(1);

  if (!session) {
    return c.json({ session: null });
  }

  return c.json({
    session: {
      id: session.id,
      status: session.status,
      tddLayoutState: parseTddLayoutState(session.tddLayoutState),
      docUrl: session.docUrl,
      createdAt: session.createdAt?.toISOString() ?? new Date().toISOString(),
    },
  });
}
