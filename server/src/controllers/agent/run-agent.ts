import { HumanMessage } from "@langchain/core/messages";
import { eq } from "drizzle-orm";
import { Context } from "hono";
import { createBriskAgent, type BriskAgentDb } from "../../agent/briskGraph";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { DEFAULT_WORKSPACE_ID } from "../../lib/tasks/task-defaults";
import { tasks } from "../../schema/schema";

type RunAgentBody = {
  inputMessage?: string;
  projectId?: string;
  workspaceId?: string;
  projectName?: string;
  projectDescription?: string;
};

function createAgentDb(
  c: Context<{ Bindings: Bindings }>,
  body: RunAgentBody,
): BriskAgentDb {
  const geminiApiKey = c.env.GEMINI_API_KEY?.trim();

  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return Object.assign(useDB(c), {
    briskConfig: {
      geminiApiKey,
      workspaceId: body.workspaceId?.trim() || DEFAULT_WORKSPACE_ID,
      projectName: body.projectName?.trim() || undefined,
      projectDescription: body.projectDescription?.trim() || undefined,
    },
  });
}

export const runAgent = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as RunAgentBody | null;

  if (!body?.projectId?.trim()) {
    return c.json({ error: "projectId is required" }, 400);
  }

  if (!body.inputMessage?.trim()) {
    return c.json({ error: "inputMessage is required" }, 400);
  }

  let agentDb: BriskAgentDb;

  try {
    agentDb = createAgentDb(c, body);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Agent configuration failed.";
    return c.json({ error: message, success: false }, 500);
  }

  const briskAgent = createBriskAgent(agentDb);
  const projectId = body.projectId.trim();

  try {
    const finalState = await briskAgent.invoke({
      messages: [new HumanMessage(body.inputMessage.trim())],
      projectId,
      isStepValid: false,
    });

    const milestoneRows = finalState.isStepValid
      ? await agentDb
          .select()
          .from(tasks)
          .where(eq(tasks.projectId, projectId))
      : [];

    const milestones = milestoneRows.filter((row) => row.parentId === null);
    const subtasks = milestoneRows.filter((row) => row.parentId !== null);

    return c.json({
      success: finalState.isStepValid,
      projectId: finalState.projectId,
      phasesCreated: milestones.length,
      tasksCreated: milestones.length + subtasks.length,
      history: finalState.messages.map((message) => ({
        type: message._getType(),
        content: message.content,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Agent execution failed.";
    return c.json({ error: message, success: false }, 500);
  }
};
