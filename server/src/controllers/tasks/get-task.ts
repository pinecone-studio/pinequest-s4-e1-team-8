import { eq } from "drizzle-orm";
import { Context } from "hono";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { toTaskListItem } from "../../lib/tasks/task-mapper";
import { tasks } from "../../schema/schema";

export const getTask = async (c: Context<{ Bindings: Bindings }>) => {
  const db = useDB(c);
  const id = c.req.param("id");

  if (!id) {
    return c.json({ error: "Task id is required" }, 400);
  }

  const [row] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);

  if (!row) {
    return c.json({ error: "Task not found" }, 404);
  }

  return c.json({ task: toTaskListItem(row) });
};
