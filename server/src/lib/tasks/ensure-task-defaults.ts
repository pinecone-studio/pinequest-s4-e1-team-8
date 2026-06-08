import { eq } from "drizzle-orm";
import type { useDB } from "../db/db";
import { projects, workspaces } from "../../schema/schema";
import { DEFAULT_PROJECT_ID, DEFAULT_WORKSPACE_ID } from "./task-defaults";

type Db = ReturnType<typeof useDB>;

/** Ensures default workspace/project rows exist for integration task inserts. */
export async function ensureTaskDefaults(db: Db) {
  const [workspace] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.id, DEFAULT_WORKSPACE_ID))
    .limit(1);

  if (!workspace) {
    await db.insert(workspaces).values({
      id: DEFAULT_WORKSPACE_ID,
      name: "Pinequest Team",
      slug: "pinequest-team",
    });
  }

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, DEFAULT_PROJECT_ID))
    .limit(1);

  if (!project) {
    await db.insert(projects).values({
      id: DEFAULT_PROJECT_ID,
      workspaceId: DEFAULT_WORKSPACE_ID,
      name: "Team Project",
      description: "Default project for synced tasks",
    });
  }
}
