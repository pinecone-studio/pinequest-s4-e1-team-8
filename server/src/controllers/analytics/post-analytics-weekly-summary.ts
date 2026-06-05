import { eq } from "drizzle-orm";
import { Context } from "hono";
import { computeTaskRisks } from "../../lib/analytics/compute-task-risks";
import { computeTaskSummary } from "../../lib/analytics/compute-task-summary";
import { computeTaskWeekly } from "../../lib/analytics/compute-task-weekly";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { generateGeminiText } from "../../lib/gemini/gemini-client";
import { DEFAULT_WORKSPACE_ID } from "../../lib/tasks/task-defaults";
import { tasks } from "../../schema/schema";

export const postAnalyticsWeeklySummary = async (
  c: Context<{ Bindings: Bindings }>,
) => {
  const db = useDB(c);
  const workspaceId = c.req.query("workspaceId") ?? DEFAULT_WORKSPACE_ID;

  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.workspaceId, workspaceId));

  const summary = computeTaskSummary(rows);
  const weekly = computeTaskWeekly(rows);
  const risks = computeTaskRisks(rows);

  const prompt = [
    "You are a project analytics assistant.",
    "Write a short weekly recap in 2-3 sentences for a team dashboard.",
    "Be direct and actionable. Do not use markdown bullets.",
    "",
    `Task summary: ${JSON.stringify(summary)}`,
    `Weekly activity: ${JSON.stringify(weekly)}`,
    `Top risks: ${JSON.stringify(risks.items.slice(0, 3))}`,
  ].join("\n");

  try {
    const text = await generateGeminiText(c.env, prompt);

    return c.json({
      summary: text,
      totals: weekly.totals,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Summary failed";
    const status = message.includes("not configured") ? 503 : 502;
    return c.json({ error: message }, status);
  }
};
