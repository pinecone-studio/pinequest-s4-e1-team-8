import { and, eq } from "drizzle-orm";
import type { Context } from "hono";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import { evaluateProjectRisk } from "../../lib/risk/evaluate-project-risk";
import { gatherProjectRiskMetrics } from "../../lib/risk/gather-project-risk-metrics";
import { resolveAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { DEFAULT_WORKSPACE_ID } from "../../lib/tasks/task-defaults";
import { projectRisks, projects } from "../../schema/schema";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

type AnalyzeRiskBody = {
  projectId?: string;
  workspaceId?: string;
};

const riskAnalyzeRoutes = new Hono<HonoEnv>();

riskAnalyzeRoutes.use(async (c, next) => {
  const userId = await resolveAuthenticatedUserId(c);
  if (!userId) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  c.set("userId", userId);
  await next();
});

riskAnalyzeRoutes.post("/", async (c) => {
  const body = (await c.req.json().catch(() => null)) as AnalyzeRiskBody | null;
  const projectId = body?.projectId?.trim();
  const workspaceId = body?.workspaceId?.trim() ?? DEFAULT_WORKSPACE_ID;

  if (!projectId) {
    return c.json({ success: false, error: "projectId is required" }, 400);
  }

  const userId = c.get("userId");
  const db = useDB(c as unknown as Context<{ Bindings: Bindings }>);

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)))
    .limit(1);

  if (!project) {
    return c.json({ success: false, error: "Project not found" }, 404);
  }

  if (!c.env.GEMINI_API_KEY?.trim()) {
    return c.json({ success: false, error: "Gemini API key is not configured" }, 503);
  }

  const metrics = await gatherProjectRiskMetrics(db, projectId, workspaceId);
  const evaluation = await evaluateProjectRisk(c.env, metrics);

  const result = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: projectRisks.id })
      .from(projectRisks)
      .where(eq(projectRisks.projectId, projectId))
      .limit(1);

    if (existing) {
      const [updated] = await tx
        .update(projectRisks)
        .set({
          userId,
          workspaceId,
          severity: evaluation.overallSeverity,
          metricsJson: JSON.stringify(metrics),
          evaluationJson: JSON.stringify(evaluation),
        })
        .where(eq(projectRisks.id, existing.id))
        .returning();

      return updated;
    }

    const [inserted] = await tx
      .insert(projectRisks)
      .values({
        id: `prisk_${nanoid(12)}`,
        userId,
        projectId,
        workspaceId,
        severity: evaluation.overallSeverity,
        metricsJson: JSON.stringify(metrics),
        evaluationJson: JSON.stringify(evaluation),
      })
      .returning();

    return inserted;
  });

  return c.json({
    success: true,
    risk: {
      id: result.id,
      projectId: result.projectId,
      workspaceId: result.workspaceId,
      severity: result.severity,
      metrics,
      evaluation,
      updatedAt: result.updatedAt,
    },
  });
});

export default riskAnalyzeRoutes;
