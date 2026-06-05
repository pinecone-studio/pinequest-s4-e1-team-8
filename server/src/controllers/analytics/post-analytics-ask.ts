import { eq } from "drizzle-orm";
import { Context } from "hono";
import { buildAnalyticsContext } from "../../lib/analytics/build-analytics-context";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { generateGeminiText } from "../../lib/gemini/gemini-client";
import { DEFAULT_WORKSPACE_ID } from "../../lib/tasks/task-defaults";
import { tasks } from "../../schema/schema";

export const postAnalyticsAsk = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as {
    question?: string;
    workspaceId?: string;
  } | null;

  const question = body?.question?.trim();
  if (!question) {
    return c.json({ error: "question is required" }, 400);
  }

  const workspaceId =
    c.req.query("workspaceId") ?? body?.workspaceId ?? DEFAULT_WORKSPACE_ID;

  const db = useDB(c);
  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.workspaceId, workspaceId));

  const context = buildAnalyticsContext(rows);

  const prompt = [
    "You are a project analytics assistant for a team dashboard.",
    "Answer the user's question using only the task data provided below.",
    "Be concise, direct, and actionable. Do not invent tasks or metrics.",
    "If the data cannot answer the question, say what is missing.",
    "",
    `Metrics: ${JSON.stringify(context.summary)}`,
    `Weekly activity: ${JSON.stringify(context.weekly)}`,
    `Risks: ${JSON.stringify({
      blocked: context.risks.blocked,
      dueThisWeek: context.risks.dueThisWeek,
      urgent: context.risks.urgent,
      items: context.risks.items.slice(0, 8),
    })}`,
    `Active tasks: ${JSON.stringify(context.activeTasks)}`,
    "",
    `Question: ${question}`,
  ].join("\n");

  try {
    const answer = await generateGeminiText(c.env, prompt);
    return c.json({ answer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ask failed";
    const status = message.includes("not configured") ? 503 : 502;
    return c.json({ error: message }, status);
  }
};
