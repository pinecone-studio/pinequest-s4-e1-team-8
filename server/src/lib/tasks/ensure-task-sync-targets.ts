import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../../schema/schema";
import { projects, workspaces } from "../../schema/schema";

type Db = DrizzleD1Database<typeof schema>;

export async function ensureTaskSyncTargets(
  db: Db,
  projectId: string,
  workspaceId: string,
): Promise<void> {
  const [workspace] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    await db
      .insert(workspaces)
      .values({
        id: workspaceId,
        name: "PineQuest Workspace",
        slug: workspaceId.replace(/_/g, "-"),
      })
      .onConflictDoNothing();
  }

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    await db
      .insert(projects)
      .values({
        id: projectId,
        workspaceId,
        name: "Team Project",
      })
      .onConflictDoNothing();
  }
}
