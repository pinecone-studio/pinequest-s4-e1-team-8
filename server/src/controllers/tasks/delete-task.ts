import { eq } from "drizzle-orm";
import { Context } from "hono";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { tasks } from "../../schema/schema";

export const deleteTask = async (c: Context<{ Bindings: Bindings }>) => {
  const db = useDB(c);
  const id = c.req.param("id");

  if (!id) {
    return c.json({ error: "Task id is required" }, 400);
  }

  const [existing] = await db
    .select({ id: tasks.id, source: tasks.source })
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
          "Only internal tasks can be deleted. GitHub and Asana tasks are read-only until sync is implemented.",
      },
      403,
    );
  }

  await db.delete(tasks).where(eq(tasks.id, id));

  return c.json({ message: "Task deleted" }, 200);
};
