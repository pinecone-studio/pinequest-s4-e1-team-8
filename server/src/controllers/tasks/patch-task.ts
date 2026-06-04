import { eq } from "drizzle-orm";
import { Context } from "hono";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import type { UpdateTaskBody } from "../../lib/tasks/task-api.types";
import {
  serializeMembers,
  toTaskListItem,
  uiPriorityToDb,
  uiStatusToDb,
} from "../../lib/tasks/task-mapper";
import { tasks } from "../../schema/schema";

export const updateTask = async (c: Context<{ Bindings: Bindings }>) => {
  const db = useDB(c);
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => null)) as UpdateTaskBody | null;

  if (!id) {
    return c.json({ error: "Task id is required" }, 400);
  }

  if (!body) {
    return c.json({ error: "Body is required" }, 400);
  }

  const [existing] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Task not found" }, 404);
  }

  if (existing.source !== "internal") {
    return c.json(
      {
        error:
          "Only internal tasks can be updated. GitHub and Asana tasks are read-only until sync is implemented.",
      },
      403,
    );
  }

  const status = uiStatusToDb(body.status);
  const priority = uiPriorityToDb(body.priority);

  const [row] = await db
    .update(tasks)
    .set({
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.tool !== undefined && { tool: body.tool }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(body.blocked !== undefined && { blocked: body.blocked }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
      ...(body.progress !== undefined && { progress: body.progress }),
      ...(body.doneCount !== undefined && { doneCount: body.doneCount }),
      ...(body.blockedCount !== undefined && { blockedCount: body.blockedCount }),
      ...(body.timeLeft !== undefined && { timeLeft: body.timeLeft }),
      ...(body.members !== undefined && {
        membersJson: serializeMembers(body.members),
      }),
      ...(body.projectId !== undefined && { projectId: body.projectId }),
      ...(body.subTeamId !== undefined && { subTeamId: body.subTeamId }),
      ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId }),
    })
    .where(eq(tasks.id, id))
    .returning();

  return c.json({ task: toTaskListItem(row) });
};
