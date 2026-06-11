import { and, eq, ne, or } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { nanoid } from "nanoid";
import * as schema from "../../schema/schema";
import {
  asanaIntegrations,
  githubIntegrations,
  projectIntegrations,
  projects,
  syncMappings,
} from "../../schema/schema";
import { DEFAULT_WORKSPACE_ID } from "../tasks/task-defaults";
import {
  CreateLeanProjectError,
  createLeanProject,
} from "./create-lean-project.service";
import type {
  ProvisionProjectInput,
  ProvisionProjectResult,
} from "./provision-project.types";

type Db = DrizzleD1Database<typeof schema>;

export class ProvisionProjectError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
    readonly field?: string,
  ) {
    super(message);
    this.name = "ProvisionProjectError";
  }
}

async function assertUniqueIntegrations(
  db: Db,
  integrations: ProvisionProjectInput["integrations"],
  excludeProjectId?: string,
) {
  const conflictFilter = or(
    eq(projectIntegrations.githubRepoId, integrations.githubRepoId),
    eq(projectIntegrations.githubProjectId, integrations.githubProjectId),
    eq(projectIntegrations.asanaProjectGid, integrations.asanaProjectGid),
  );

  const [existing] = await db
    .select({
      projectId: projectIntegrations.projectId,
      githubRepoId: projectIntegrations.githubRepoId,
      githubProjectId: projectIntegrations.githubProjectId,
      asanaProjectGid: projectIntegrations.asanaProjectGid,
    })
    .from(projectIntegrations)
    .where(
      excludeProjectId
        ? and(conflictFilter, ne(projectIntegrations.projectId, excludeProjectId))
        : conflictFilter,
    )
    .limit(1);

  if (!existing) return;

  if (existing.githubRepoId === integrations.githubRepoId) {
    throw new ProvisionProjectError(
      "This GitHub repository is already linked to another Brisk project",
      409,
      "githubRepoId",
    );
  }
  if (existing.githubProjectId === integrations.githubProjectId) {
    throw new ProvisionProjectError(
      "This GitHub project is already linked to another Brisk project",
      409,
      "githubProjectId",
    );
  }
  throw new ProvisionProjectError(
    "This Asana project is already linked to another Brisk project",
    409,
    "asanaProjectGid",
  );
}

export async function provisionProject(
  db: Db,
  userId: string,
  input: ProvisionProjectInput,
): Promise<ProvisionProjectResult> {
  await assertUniqueIntegrations(db, input.integrations);

  let projectId: string;
  let workspaceId: string;
  let inviteToken: string;

  try {
    const created = await createLeanProject(
      db,
      userId,
      {
        name: input.name,
        description: input.description,
        workspaceId: input.workspaceId,
        milestones: [],
      },
    );
    projectId = created.projectId;
    workspaceId = input.workspaceId?.trim() || DEFAULT_WORKSPACE_ID;
    inviteToken = created.inviteToken;
  } catch (error) {
    if (error instanceof Error && error.name === "CreateLeanProjectError") {
      const leanError = error as CreateLeanProjectError;
      throw new ProvisionProjectError(leanError.message, leanError.status);
    }
    throw error;
  }

  const now = new Date();
  const integrationId = `pint_${nanoid(10)}`;

  await db
    .update(projects)
    .set({
      githubConnected: true,
      asanaConnected: true,
      isGithubDisconnected: false,
      isAsanaDisconnected: false,
      updatedAt: now,
    })
    .where(eq(projects.id, projectId));

  const [githubIntegration] = await db
    .select({ id: githubIntegrations.id })
    .from(githubIntegrations)
    .where(eq(githubIntegrations.userId, userId))
    .limit(1);

  if (githubIntegration) {
    await db
      .update(githubIntegrations)
      .set({
        repoOwner: input.integrations.githubRepoOwner,
        repoName: input.integrations.githubRepoName,
        githubProjectId: input.integrations.githubProjectId,
        updatedAt: now,
      })
      .where(eq(githubIntegrations.id, githubIntegration.id));
  }

  const [asanaIntegration] = await db
    .select({ id: asanaIntegrations.id })
    .from(asanaIntegrations)
    .where(eq(asanaIntegrations.userId, userId))
    .limit(1);

  if (asanaIntegration) {
    await db
      .update(asanaIntegrations)
      .set({
        workspaceGid: input.integrations.asanaWorkspaceGid,
        projectGid: input.integrations.asanaProjectGid,
        projectName: input.integrations.asanaProjectName,
        updatedAt: now,
      })
      .where(eq(asanaIntegrations.id, asanaIntegration.id));
  }

  await db.insert(projectIntegrations).values({
    id: integrationId,
    projectId,
    userId,
    githubRepoOwner: input.integrations.githubRepoOwner,
    githubRepoName: input.integrations.githubRepoName,
    githubRepoId: input.integrations.githubRepoId,
    githubProjectId: input.integrations.githubProjectId,
    githubProjectTitle: input.integrations.githubProjectTitle,
    asanaWorkspaceGid: input.integrations.asanaWorkspaceGid,
    asanaProjectGid: input.integrations.asanaProjectGid,
    asanaProjectName: input.integrations.asanaProjectName,
    createdAt: now,
    updatedAt: now,
  });

  const [existingSyncMapping] = await db
    .select({ id: syncMappings.id })
    .from(syncMappings)
    .where(
      and(
        eq(syncMappings.userId, userId),
        or(
          eq(syncMappings.githubRepoId, input.integrations.githubRepoId),
          eq(syncMappings.asanaProjectGid, input.integrations.asanaProjectGid),
        ),
      ),
    )
    .limit(1);

  if (!existingSyncMapping) {
    await db.insert(syncMappings).values({
      id: crypto.randomUUID(),
      userId,
      githubRepoId: input.integrations.githubRepoId,
      asanaProjectGid: input.integrations.asanaProjectGid,
    });
  }

  return {
    projectId,
    workspaceId,
    name: input.name,
    inviteToken,
    integration: input.integrations,
  };
}

export async function listProjectIntegrations(db: Db, userId: string) {
  return db
    .select({
      projectId: projectIntegrations.projectId,
      projectName: projects.name,
      githubRepoId: projectIntegrations.githubRepoId,
      githubRepoOwner: projectIntegrations.githubRepoOwner,
      githubRepoName: projectIntegrations.githubRepoName,
      githubProjectId: projectIntegrations.githubProjectId,
      githubProjectTitle: projectIntegrations.githubProjectTitle,
      asanaProjectGid: projectIntegrations.asanaProjectGid,
      asanaProjectName: projectIntegrations.asanaProjectName,
    })
    .from(projectIntegrations)
    .innerJoin(projects, eq(projectIntegrations.projectId, projects.id))
    .where(eq(projectIntegrations.userId, userId));
}
