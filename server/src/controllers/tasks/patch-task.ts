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

  if (existing.source === "github") {
    return c.json(
      { error: "GitHub tasks are read-only until two-way sync is implemented." },
      403,
    );
  }

  const status = uiStatusToDb(body.status);
  const priority = uiPriorityToDb(body.priority);
  const isDone = status === "DONE";
  const wasDone = existing.status === "DONE";

  const [row] = await db
    .update(tasks)
    .set({
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.description !== undefined && { description: body.description }),
      ...(existing.source === "internal" &&
        body.tool !== undefined && { tool: body.tool }),
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
      ...(existing.source === "internal" && body.projectId !== undefined && {
        projectId: body.projectId,
      }),
      ...(existing.source === "internal" && body.subTeamId !== undefined && {
        subTeamId: body.subTeamId,
      }),
      ...(existing.source === "internal" && body.assigneeId !== undefined && {
        assigneeId: body.assigneeId,
      }),
      ...(status !== undefined &&
        isDone && {
          progress: 100,
          doneCount: 1,
          timeLeft: "Completed",
        }),
      ...(status !== undefined &&
        wasDone &&
        !isDone && {
          progress: 40,
          doneCount: 0,
        }),
    })
    .where(eq(tasks.id, id))
    .returning();

  return c.json({ task: toTaskListItem(row) });
};
