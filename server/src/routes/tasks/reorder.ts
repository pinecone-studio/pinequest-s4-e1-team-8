import { asc, eq, inArray } from "drizzle-orm";
import type { Context } from "hono";
import { Hono } from "hono";
import { resolveAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import {
  serializeDependencyTaskIds,
  toReorderedTaskDto,
  uiPriorityToDb,
} from "../../lib/tasks/task-mapper";
import { validateReprioritizeBody } from "../../lib/tasks/validate-reprioritize-payload";
import { projects, tasks } from "../../schema/schema";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

const taskReorderRoutes = new Hono<HonoEnv>();

taskReorderRoutes.use(async (c, next) => {
  const userId = await resolveAuthenticatedUserId(c);
  if (!userId) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  c.set("userId", userId);
  await next();
});

taskReorderRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const validation = validateReprioritizeBody(body);

  if (!validation.ok) {
    return c.json({ success: false, error: validation.error }, 400);
  }

  const { projectId, updates } = validation.data;
  const db = useDB(c as unknown as Context<{ Bindings: Bindings }>);

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    return c.json({ success: false, error: "Project not found" }, 404);
  }

  const projectTasks = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  const projectTaskIds = new Set(projectTasks.map((task) => task.id));

  for (const update of updates) {
    if (!projectTaskIds.has(update.taskId)) {
      return c.json(
        { success: false, error: `Task ${update.taskId} does not belong to project ${projectId}` },
        400,
      );
    }

    for (const dependencyTaskId of update.dependencyTaskIds) {
      if (!projectTaskIds.has(dependencyTaskId)) {
        return c.json(
          {
            success: false,
            error: `Dependency task ${dependencyTaskId} does not belong to project ${projectId}`,
          },
          400,
        );
      }

      if (dependencyTaskId === update.taskId) {
        return c.json(
          { success: false, error: `Task ${update.taskId} cannot depend on itself` },
          400,
        );
      }
    }
  }

  await db.transaction(async (tx) => {
    for (const update of updates) {
      const priority = uiPriorityToDb(update.priority);
      await tx
        .update(tasks)
        .set({
          ...(priority !== undefined && { priority }),
          sequenceOrder: update.sequenceOrder,
          dependencyTaskIdsJson: serializeDependencyTaskIds(update.dependencyTaskIds),
        })
        .where(eq(tasks.id, update.taskId));
    }
  });

  const reorderedRows = await db
    .select()
    .from(tasks)
    .where(inArray(tasks.id, [...projectTaskIds]))
    .orderBy(asc(tasks.sequenceOrder));

  return c.json({
    success: true,
    tasks: reorderedRows.map(toReorderedTaskDto),
  });
});

export default taskReorderRoutes;
