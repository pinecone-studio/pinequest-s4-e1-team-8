import { and, eq } from "drizzle-orm";
import type { Context } from "hono";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import { computeCycleMetrics } from "../../lib/analytics/compute-cycle-metrics";
import { processMetricsMatrix } from "../../lib/analytics/process-metrics-matrix";
import { resolveAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { DEFAULT_WORKSPACE_ID } from "../../lib/tasks/task-defaults";
import { analyticsMetrics, projects, tasks } from "../../schema/schema";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

type ComputeMetricsBody = {
  projectId?: string;
  workspaceId?: string;
};

const analyticsMetricsRoutes = new Hono<HonoEnv>();

analyticsMetricsRoutes.use(async (c, next) => {
  const userId = await resolveAuthenticatedUserId(
    c as unknown as Parameters<typeof resolveAuthenticatedUserId>[0],
  );
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", userId);
  await next();
});

analyticsMetricsRoutes.post("/compute-metrics", async (c) => {
  const body = (await c.req.json().catch(() => null)) as ComputeMetricsBody | null;
  const projectId = body?.projectId?.trim() || null;
  const workspaceId = body?.workspaceId?.trim() ?? DEFAULT_WORKSPACE_ID;
  const userId = c.get("userId");
  const db = useDB(c as unknown as Context<{ Bindings: Bindings }>);

  if (projectId) {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)))
      .limit(1);

    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }
  }

  const taskConditions = projectId
    ? and(eq(tasks.workspaceId, workspaceId), eq(tasks.projectId, projectId))
    : eq(tasks.workspaceId, workspaceId);

  const taskRows = await db.select().from(tasks).where(taskConditions);
  const aggregation = computeCycleMetrics(taskRows);

  if (!c.env.GEMINI_API_KEY?.trim()) {
    return c.json({ error: "Gemini API key is not configured" }, 503);
  }

  const matrix = await processMetricsMatrix(c.env, aggregation);
  const metricId = `am_${nanoid(12)}`;

  await db.transaction(async (tx) => {
    await tx.insert(analyticsMetrics).values({
      id: metricId,
      userId,
      projectId,
      workspaceId,
      cycleMetricsJson: JSON.stringify(aggregation),
      matrixJson: JSON.stringify(matrix),
    });
  });

  return c.json({
    id: metricId,
    workspaceId,
    projectId,
    aggregation,
    matrix,
  });
});

export default analyticsMetricsRoutes;
