import { and, eq, isNull, type SQL } from "drizzle-orm";
import { Context } from "hono";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { isTaskSource, toTaskListItem } from "../../lib/tasks/task-mapper";
import { tasks } from "../../schema/schema";

export const getTasks = async (c: Context<{ Bindings: Bindings }>) => {
  const db = useDB(c);
  const sourceParam = c.req.query("source");
  const projectId = c.req.query("projectId")?.trim();
  const milestonesOnly = c.req.query("milestones") === "true";

  if (sourceParam !== undefined && !isTaskSource(sourceParam)) {
    return c.json(
      { error: "Invalid source. Use github, asana, or internal." },
      400,
    );
  }

  const conditions: SQL[] = [];

  if (projectId) {
    conditions.push(eq(tasks.projectId, projectId));
  }

  if (milestonesOnly) {
    conditions.push(isNull(tasks.parentId));
  }

  if (sourceParam !== undefined && isTaskSource(sourceParam)) {
    conditions.push(eq(tasks.source, sourceParam));
  }

  const rows =
    conditions.length > 0
      ? await db
          .select()
          .from(tasks)
          .where(and(...conditions))
      : await db.select().from(tasks);

  return c.json({
    tasks: rows.map(toTaskListItem),
  });
};
