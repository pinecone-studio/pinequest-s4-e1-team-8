import { Context } from "hono";
import { nanoid } from "nanoid";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import type { CreateTaskBody } from "../../lib/tasks/task-api.types";
import {
  DEFAULT_PROJECT_ID,
  DEFAULT_WORKSPACE_ID,
} from "../../lib/tasks/task-defaults";
import {
  serializeMembers,
  toTaskListItem,
  uiPriorityToDb,
  uiStatusToDb,
} from "../../lib/tasks/task-mapper";
import { tasks } from "../../schema/schema";

export const createTask = async (c: Context<{ Bindings: Bindings }>) => {
  const db = useDB(c);
  const body = (await c.req.json().catch(() => null)) as CreateTaskBody | null;

  if (!body?.title?.trim()) {
    return c.json({ error: "title is required" }, 400);
  }

  const status = uiStatusToDb(body.status) ?? "TODO";
  const priority = uiPriorityToDb(body.priority) ?? "MEDIUM";

  const [row] = await db
    .insert(tasks)
    .values({
      id: `internal-${nanoid(10)}`,
      workspaceId: body.workspaceId ?? DEFAULT_WORKSPACE_ID,
      projectId: body.projectId ?? DEFAULT_PROJECT_ID,
      subTeamId: body.subTeamId ?? null,
      assigneeId: body.assigneeId ?? null,
      title: body.title.trim(),
      description: body.description ?? null,
      status,
      priority,
      source: "internal",
      tool: body.tool ?? "Internal",
      dueDate: body.dueDate ?? null,
      progress: body.progress ?? 0,
      blocked: body.blocked ?? false,
      doneCount: body.doneCount ?? 0,
      blockedCount: body.blockedCount ?? 0,
      timeLeft: body.timeLeft ?? null,
      membersJson: serializeMembers(body.members),
    })
    .returning();

  return c.json({ task: toTaskListItem(row) }, 201);
};
