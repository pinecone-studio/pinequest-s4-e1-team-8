import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { nanoid } from "nanoid";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import type { InitializeProjectPayload } from "../../lib/projects/initialize-project.types";
import { validateInitializeProjectPayload } from "../../lib/projects/validate-initialize-payload";
import { DEFAULT_WORKSPACE_ID } from "../../lib/tasks/task-defaults";
import {
  members,
  projectCollaborators,
  projects,
  tasks,
} from "../../schema/schema";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

type InitializeProjectResult = {
  projectId: string;
  workspaceId: string;
  collaboratorsLinked: number;
  milestonesCreated: number;
  tasksCreated: number;
};

async function resolveWorkspaceId(
  db: ReturnType<typeof useDB>,
  userId: string,
  requestedWorkspaceId?: string,
): Promise<string> {
  if (requestedWorkspaceId) {
    return requestedWorkspaceId;
  }

  const [membership] = await db
    .select({ workspaceId: members.workspaceId })
    .from(members)
    .where(eq(members.userId, userId))
    .limit(1);

  return membership?.workspaceId ?? DEFAULT_WORKSPACE_ID;
}

async function persistInitializeProject(
  db: ReturnType<typeof useDB>,
  userId: string,
  payload: InitializeProjectPayload,
): Promise<InitializeProjectResult> {
  const projectId = payload.projectId ?? `proj_${nanoid(10)}`;
  const workspaceId = await resolveWorkspaceId(
    db,
    userId,
    payload.workspaceId,
  );

  return db.transaction(async (tx) => {

    await tx.insert(projects).values({
      id: projectId,
      workspaceId,
      ownerId: userId,
      name: payload.step1.projectName,
      description: payload.step1.description || null,
      timezone: payload.step1.timezone,
      githubConnected: payload.step3.githubConnected,
      asanaConnected: payload.step3.asanaConnected,
      isGithubDisconnected: payload.step3.isGithubDisconnected,
      isAsanaDisconnected: payload.step3.isAsanaDisconnected,
    });

    if (payload.step2.collaborators.length > 0) {
      await tx.insert(projectCollaborators).values(
        payload.step2.collaborators.map((collaborator) => ({
          id: `pcol_${nanoid(10)}`,
          projectId,
          email: collaborator.email,
          role: collaborator.role,
        })),
      );
    }

    const approvedMilestones = payload.step4.milestoneDrafts.filter(
      (draft) => draft.isApproved,
    );

    let milestonesCreated = 0;
    let tasksCreated = 0;

    for (const milestone of approvedMilestones) {
      const milestoneTaskId = `internal-${nanoid(10)}`;

      await tx.insert(tasks).values({
        id: milestoneTaskId,
        workspaceId,
        projectId,
        title: milestone.title,
        status: "TODO",
        priority: "HIGH",
        source: "internal",
        tool: "Brisk Onboarding",
      });

      milestonesCreated += 1;
      tasksCreated += 1;

      for (const taskTitle of milestone.tasks) {
        await tx.insert(tasks).values({
          id: `internal-${nanoid(10)}`,
          workspaceId,
          projectId,
          parentId: milestoneTaskId,
          title: taskTitle,
          status: "BACKLOG",
          priority: "MEDIUM",
          source: "internal",
          tool: "Brisk Onboarding",
        });

        tasksCreated += 1;
      }
    }

    return {
      projectId,
      workspaceId,
      collaboratorsLinked: payload.step2.collaborators.length,
      milestonesCreated,
      tasksCreated,
    };
  });
}

export const initializeProject = async (c: Context<HonoEnv>) => {
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  const raw = await c.req.json().catch(() => null);
  const validation = validateInitializeProjectPayload(raw);

  if (!validation.ok) {
    return c.json(
      {
        success: false,
        error: validation.error,
        field: validation.field,
      },
      400,
    );
  }

  const db = useDB(c as unknown as Context<{ Bindings: Bindings }>);

  try {
    const result = await persistInitializeProject(db, userId, validation.data);

    return c.json(
      {
        success: true,
        ...result,
      },
      201,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Project initialization failed and was rolled back.";

    return c.json(
      {
        success: false,
        error: message,
      },
      500,
    );
  }
};
