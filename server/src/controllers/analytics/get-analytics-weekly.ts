import { eq } from "drizzle-orm";
import { Context } from "hono";
import { computeTaskWeekly } from "../../lib/analytics/compute-task-weekly";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { DEFAULT_WORKSPACE_ID } from "../../lib/tasks/task-defaults";
import { tasks } from "../../schema/schema";

export const getAnalyticsWeekly = async (c: Context<{ Bindings: Bindings }>) => {
  const db = useDB(c);
  const workspaceId = c.req.query("workspaceId") ?? DEFAULT_WORKSPACE_ID;

  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.workspaceId, workspaceId));

  return c.json({ weekly: computeTaskWeekly(rows) });
};
