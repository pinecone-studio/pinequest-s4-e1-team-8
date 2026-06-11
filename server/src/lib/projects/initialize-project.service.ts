import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { nanoid } from "nanoid";
import { DEFAULT_WORKSPACE_ID } from "../tasks/task-defaults";
import { createInviteToken } from "./invite-token";
import type { InitializeProjectPayload } from "./initialize-project.types";
import * as schema from "../../schema/schema";
import {
  projectCollaborators,
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
  for (const draft of milestoneDrafts) {
    if (!draft.title.trim()) {
      continue;
    }

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

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  return { project, projectId, workspaceId, inviteToken };
}
