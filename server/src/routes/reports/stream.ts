import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { nanoid } from "nanoid";
import {
  buildPerformanceReportContext,
  streamPerformanceReportSynthesis,
} from "../../agent/summarize-performance-report";
import { resolveAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { DEFAULT_WORKSPACE_ID } from "../../lib/tasks/task-defaults";
import { projects, reportSnapshots, tasks } from "../../schema/schema";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

const reportStreamRoutes = new Hono<HonoEnv>();

reportStreamRoutes.use(async (c, next) => {
  const userId = await resolveAuthenticatedUserId(
    c as unknown as Parameters<typeof resolveAuthenticatedUserId>[0],
  );
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", userId);
  await next();
});

reportStreamRoutes.get("/run", async (c) => {
  const projectId = c.req.query("projectId")?.trim();
  if (!projectId) {
    return c.json({ error: "projectId is required" }, 400);
  }

  const workspaceId = c.req.query("workspaceId")?.trim() ?? DEFAULT_WORKSPACE_ID;
  const userId = c.get("userId");
  const db = useDB(c);

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)))
    .limit(1);

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  const taskRows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.workspaceId, workspaceId)));

  const context = buildPerformanceReportContext(
    projectId,
    workspaceId,
    project.name,
    taskRows,
  );

  if (!c.env.GEMINI_API_KEY?.trim()) {
    return c.json({ error: "Gemini API key is not configured" }, 503);
  }

  return streamText(c, async (stream) => {
    let outputBuffer = "";
    let completed = false;

    try {
      for await (const chunk of streamPerformanceReportSynthesis(
        c.env,
        context,
        c.req.raw.signal,
      )) {
        if (stream.aborted) {
          return;
        }

        outputBuffer += chunk;
        await stream.write(chunk);
      }

      completed = true;
    } catch (error) {
      if (!stream.aborted) {
        const message =
          error instanceof Error ? error.message : "Performance report stream failed";
        await stream.write(`\n\nStream error: ${message}`);
      }
      return;
    } finally {
      if (!completed || stream.aborted || outputBuffer.trim().length === 0) {
        return;
      }

      const snapshotId = `rpt_${nanoid(12)}`;
      const completedAt = new Date();

      await db.transaction(async (tx) => {
        await tx.insert(reportSnapshots).values({
          id: snapshotId,
          userId,
          projectId,
          workspaceId,
          content: outputBuffer,
          contextJson: JSON.stringify(context),
          completedAt,
        });
      });
    }
  });
});

export default reportStreamRoutes;
