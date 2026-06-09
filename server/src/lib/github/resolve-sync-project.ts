import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { DEFAULT_PROJECT_ID } from "../tasks/task-defaults";
import * as schema from "../../schema/schema";
import { projects } from "../../schema/schema";

type Db = DrizzleD1Database<typeof schema>;

export type SyncProjectContext = {
  projectId: string;
  workspaceId: string;
  resolvedFrom: "requested" | "accessible" | "default";
};

async function loadProject(db: Db, projectId: string) {
  const [project] = await db
    .select({ id: projects.id, workspaceId: projects.workspaceId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  return project ?? null;
}

export async function resolveGithubSyncProject(
  db: Db,
  userId: string,
  requestedProjectId?: string,
): Promise<SyncProjectContext | null> {
  const normalizedRequest = requestedProjectId?.trim();

  if (normalizedRequest) {
    const project = await loadProject(db, normalizedRequest);
    if (project) {
      return {
        projectId: project.id,
        workspaceId: project.workspaceId,
        resolvedFrom: "requested",
      };
    }
  }

  const [ownedProject] = await db
    .select({ id: projects.id, workspaceId: projects.workspaceId })
    .from(projects)
    .where(eq(projects.ownerId, userId))
    .limit(1);

  if (ownedProject) {
    return {
      projectId: ownedProject.id,
      workspaceId: ownedProject.workspaceId,
      resolvedFrom: "accessible",
    };
  }

  const defaultProject = await loadProject(db, DEFAULT_PROJECT_ID);
  if (defaultProject) {
    return {
      projectId: defaultProject.id,
      workspaceId: defaultProject.workspaceId,
      resolvedFrom: "default",
    };
  }

  return null;
}
