import { and, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { nanoid } from "nanoid";
import { DEFAULT_WORKSPACE_ID } from "../tasks/task-defaults";
import { createInviteToken } from "./invite-token";
import type { InitializeProjectPayload } from "./initialize-project.types";
import type { TddLayoutState } from "../onboarding/tdd-types";
import * as schema from "../../schema/schema";
import {
  asanaIntegrations,
  githubIntegrations,
  onboardingSessions,
  projectCollaborators,
  projectIntegrations,
  projectResources,
  projects,
  tasks,
  workspaces,
} from "../../schema/schema";

type Db = DrizzleD1Database<typeof schema>;

async function ensureWorkspace(db: Db, workspaceId: string) {
  const [existing] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (existing) {
    return;
  }

  await db.insert(workspaces).values({
    id: workspaceId,
    name: "Pinequest",
    slug: workspaceId.replace(/^ws_/, ""),
  });
}

async function persistMilestones(
  db: Db,
  projectId: string,
  workspaceId: string,
  milestoneDrafts: InitializeProjectPayload["step4"]["milestoneDrafts"],
) {
  const approvedDrafts = milestoneDrafts.filter(
    (draft) => draft.isApproved && draft.title.trim(),
  );

  for (const draft of approvedDrafts) {
    const milestoneId = `milestone-${nanoid(8)}`;
    await db.insert(tasks).values({
      id: milestoneId,
      workspaceId,
      projectId,
      parentId: null,
      title: draft.title.trim(),
      description: null,
      status: "TODO",
      priority: "MEDIUM",
      source: "internal",
      tool: "Internal",
      progress: 0,
      blocked: false,
      doneCount: 0,
      blockedCount: 0,
      membersJson: "[]",
    });

    for (const subtaskTitle of draft.tasks) {
      if (!subtaskTitle.trim()) {
        continue;
      }
      await db.insert(tasks).values({
        id: `internal-${nanoid(8)}`,
        workspaceId,
        projectId,
        parentId: milestoneId,
        title: subtaskTitle.trim(),
        status: "BACKLOG",
        priority: "MEDIUM",
        source: "internal",
        tool: "Internal",
        progress: 0,
        blocked: false,
        doneCount: 0,
        blockedCount: 0,
        membersJson: "[]",
      });
    }
  }
}

async function linkOnboardingSession(
  db: Db,
  ownerId: string,
  projectId: string,
  payload: InitializeProjectPayload,
) {
  const sessionId = payload.onboardingSessionId?.trim();
  if (!sessionId) {
    return;
  }

  const updates: Partial<{
    projectId: string;
    tddLayoutState: string;
    status: "CONCLUDED";
  }> = {
    projectId,
  };

  const layout = payload.tddLayoutState;
  if (
    layout &&
    typeof layout === "object" &&
    Array.isArray((layout as TddLayoutState).blocks)
  ) {
    updates.tddLayoutState = JSON.stringify(layout);
  }

  if (payload.tddConfirmed) {
    updates.status = "CONCLUDED";
  }

  await db
    .update(onboardingSessions)
    .set(updates)
    .where(
      and(
        eq(onboardingSessions.id, sessionId),
        eq(onboardingSessions.userId, ownerId),
      ),
    );
}

async function persistProjectIntegrations(
  db: Db,
  userId: string,
  projectId: string,
  step3: InitializeProjectPayload["step3"],
) {
  if (!step3.githubConnected && !step3.asanaConnected) {
    return;
  }

  const [github] = step3.githubConnected
    ? await db
        .select()
        .from(githubIntegrations)
        .where(eq(githubIntegrations.userId, userId))
        .limit(1)
    : [undefined];

  const [asana] = step3.asanaConnected
    ? await db
        .select()
        .from(asanaIntegrations)
        .where(eq(asanaIntegrations.userId, userId))
        .limit(1)
    : [undefined];

  const hasGithub = Boolean(github?.repoOwner && github?.repoName);
  const hasAsana = Boolean(asana?.projectGid);

  if (!hasGithub && !hasAsana) {
    return;
  }

  const githubRepoId =
    github?.repoOwner && github?.repoName
      ? `${github.repoOwner}/${github.repoName}`
      : null;

  const integrationValues = {
    userId,
    githubRepoOwner: github?.repoOwner ?? null,
    githubRepoName: github?.repoName ?? null,
    githubRepoId,
    githubProjectId: github?.githubProjectId ?? null,
    githubProjectTitle: null as string | null,
    asanaWorkspaceGid: asana?.workspaceGid ?? null,
    asanaProjectGid: asana?.projectGid ?? null,
    asanaProjectName: asana?.projectName ?? null,
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select({ id: projectIntegrations.id })
    .from(projectIntegrations)
    .where(eq(projectIntegrations.projectId, projectId))
    .limit(1);

  try {
    if (existing) {
      await db
        .update(projectIntegrations)
        .set(integrationValues)
        .where(eq(projectIntegrations.id, existing.id));
    } else {
      await db.insert(projectIntegrations).values({
        id: `pint_${nanoid(10)}`,
        projectId,
        ...integrationValues,
      });
    }
  } catch {
    // Unique constraints on repo/project GIDs — skip if already linked elsewhere.
  }
}

async function persistEssentialResources(
  db: Db,
  projectId: string,
  resources: InitializeProjectPayload["essentialResources"],
) {
  if (!resources?.length) {
    return;
  }

  await db
    .delete(projectResources)
    .where(eq(projectResources.projectId, projectId));

  for (const [index, resource] of resources.entries()) {
    await db.insert(projectResources).values({
      id: `res_${nanoid(10)}`,
      projectId,
      name: resource.name.trim(),
      url: resource.url.trim(),
      sortOrder: index,
    });
  }
}

export async function initializeProject(
  db: Db,
  ownerId: string,
  payload: InitializeProjectPayload,
) {
  const workspaceId = payload.workspaceId?.trim() || DEFAULT_WORKSPACE_ID;
  const projectId =
    payload.projectId?.trim() || `proj_${nanoid(12).replace(/-/g, "")}`;

  await ensureWorkspace(db, workspaceId);

  const [existing] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  const inviteToken = existing?.inviteToken ?? createInviteToken();
  const aiGoals = payload.aiGoals?.trim() || null;

  const projectValues = {
    id: projectId,
    workspaceId,
    ownerId,
    name: payload.step1.projectName.trim(),
    description: payload.step1.description.trim() || null,
    timezone: payload.step1.timezone.trim() || null,
    githubConnected: payload.step3.githubConnected,
    asanaConnected: payload.step3.asanaConnected,
    isGithubDisconnected: payload.step3.isGithubDisconnected,
    isAsanaDisconnected: payload.step3.isAsanaDisconnected,
    inviteToken,
    aiGoals,
  };

  if (existing) {
    await db
      .update(projects)
      .set(projectValues)
      .where(eq(projects.id, projectId));
  } else {
    await db.insert(projects).values(projectValues);
  }

  await db
    .delete(projectCollaborators)
    .where(eq(projectCollaborators.projectId, projectId));

  for (const collaborator of payload.step2.collaborators) {
    const email = collaborator.email.trim().toLowerCase();
    if (!email) {
      continue;
    }
    await db.insert(projectCollaborators).values({
      id: `collab_${nanoid(10)}`,
      projectId,
      email,
      role: collaborator.role,
    });
  }

  if (payload.step4.milestoneDrafts.length > 0) {
    await db.delete(tasks).where(eq(tasks.projectId, projectId));
    await persistMilestones(
      db,
      projectId,
      workspaceId,
      payload.step4.milestoneDrafts,
    );
  }

  await linkOnboardingSession(db, ownerId, projectId, payload);
  await persistProjectIntegrations(db, ownerId, projectId, payload.step3);
  await persistEssentialResources(db, projectId, payload.essentialResources);

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  return { project, projectId, workspaceId, inviteToken };
}
