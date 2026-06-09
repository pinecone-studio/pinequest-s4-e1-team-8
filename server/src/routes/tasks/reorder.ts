import { eq } from "drizzle-orm";
import { Hono } from "hono";
import type { Context } from "hono";
import { resolveAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { toTaskListItem, uiPriorityToDb } from "../../lib/tasks/task-mapper";
import { tasks } from "../../schema/schema";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

type PriorityInput = "Low" | "Medium" | "High";

type TaskUpdateEntry = {
  taskId: string;
  priority: PriorityInput;
  sequenceOrder: number;
  dependencyTaskIds: string[];
};

type ReprioritizeBody = {
  projectId: string;
  updates: TaskUpdateEntry[];
};

function isValidPriority(value: unknown): value is PriorityInput {
  return value === "Low" || value === "Medium" || value === "High";
}

function isTaskUpdateEntry(value: unknown): value is TaskUpdateEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.taskId === "string" &&
    entry.taskId.trim().length > 0 &&
    isValidPriority(entry.priority) &&
    typeof entry.sequenceOrder === "number" &&
    Number.isFinite(entry.sequenceOrder) &&
    Array.isArray(entry.dependencyTaskIds) &&
    (entry.dependencyTaskIds as unknown[]).every(
      (id) => typeof id === "string",
    )
  );
}

function parseReprioritizeBody(raw: unknown): ReprioritizeBody | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  if (typeof body.projectId !== "string" || !body.projectId.trim()) return null;
  if (!Array.isArray(body.updates)) return null;
  if (!(body.updates as unknown[]).every(isTaskUpdateEntry)) return null;
  return {
    projectId: body.projectId.trim(),
    updates: body.updates as TaskUpdateEntry[],
  };
}

const reorderRoutes = new Hono<HonoEnv>();

reorderRoutes.use(async (c, next) => {
  const userId = await resolveAuthenticatedUserId(c);
  if (!userId) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }
  c.set("userId", userId);
  await next();
});

reorderRoutes.post("/reprioritize", async (c) => {
  const raw = await c.req.json().catch(() => null);
  const body = parseReprioritizeBody(raw);

  if (!body) {
    return c.json({ success: false, error: "Invalid request body" }, 400);
  }

  const db = useDB(c as unknown as Context<{ Bindings: Bindings }>);

  try {
    const updated = await db.transaction(async (tx) => {
      const results = [];

      for (const entry of body.updates) {
        const dbPriority = uiPriorityToDb(entry.priority.toLowerCase());
        if (!dbPriority) continue;

        const [row] = await tx
          .update(tasks)
          .set({
            priority: dbPriority,
            sequenceOrder: entry.sequenceOrder,
            dependenciesJson: JSON.stringify(entry.dependencyTaskIds),
          })
          .where(eq(tasks.id, entry.taskId))
          .returning();

        if (row) {
          results.push(row);
        }
      }

      return results;
    });

    return c.json({
      success: true,
      tasks: updated.map(toTaskListItem),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Reprioritization failed";
    return c.json({ success: false, error: message }, 500);
  }
});

export default reorderRoutes;
