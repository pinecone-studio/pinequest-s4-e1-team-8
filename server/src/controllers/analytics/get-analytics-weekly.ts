import { eq } from "drizzle-orm";
import { Context } from "hono";
import { computeTaskWeekly } from "../../lib/analytics/compute-task-weekly";
import { taskTeamKey } from "../../lib/analytics/task-team-key";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { DEFAULT_WORKSPACE_ID } from "../../lib/tasks/task-defaults";
import { tasks } from "../../schema/schema";

export const getAnalyticsWeekly = async (c: Context<{ Bindings: Bindings }>) => {
  const db = useDB(c);
  const workspaceId = c.req.query("workspaceId") ?? DEFAULT_WORKSPACE_ID;
  const team = c.req.query("team")?.trim() || null;

  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.workspaceId, workspaceId));

  const filtered = team
    ? rows.filter((row) => taskTeamKey(row) === team)
    : rows;

  return c.json({ weekly: computeTaskWeekly(filtered) });
};
