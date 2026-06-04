import { eq } from "drizzle-orm";
import { Context } from "hono";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { isTaskSource, toTaskListItem } from "../../lib/tasks/task-mapper";
import { tasks } from "../../schema/schema";

export const getTasks = async (c: Context<{ Bindings: Bindings }>) => {
  const db = useDB(c);
  const sourceParam = c.req.query("source");

  if (sourceParam !== undefined && !isTaskSource(sourceParam)) {
    return c.json(
      { error: "Invalid source. Use github, asana, or internal." },
      400,
    );
  }

  const rows =
    sourceParam !== undefined && isTaskSource(sourceParam)
      ? await db.select().from(tasks).where(eq(tasks.source, sourceParam))
      : await db.select().from(tasks);

  return c.json({
    tasks: rows.map(toTaskListItem),
  });
};
