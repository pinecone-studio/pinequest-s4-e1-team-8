import { HumanMessage } from "@langchain/core/messages";
import { eq } from "drizzle-orm";
import { Context } from "hono";
import { briskAgent, type BriskAgentDb } from "../../agent/briskGraph";
import type { BriskErrorCode } from "../../agent/brisk.state";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { DEFAULT_WORKSPACE_ID } from "../../lib/tasks/task-defaults";
import { tasks } from "../../schema/schema";

type RunAgentBody = {
  inputMessage: string;
  projectId: string;
  workspaceId?: string;
  userId?: string;
  projectName?: string;
  projectDescription?: string;
};

type ValidationResult =
  | { ok: true; data: RunAgentBody }
  | { ok: false; error: string; field: string };

const ERROR_HTTP_STATUS: Record<BriskErrorCode, ContentfulStatusCode> = {
  INVALID_INPUT: 400,
  WORKSPACE_NOT_FOUND: 404,
  MODEL_FAILURE: 502,
  INVALID_BREAKDOWN: 422,
  DB_WRITE_FAILED: 500,
};

function validateBody(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Request body must be a JSON object.", field: "body" };
  }

  const b = raw as Record<string, unknown>;

  if (!b.projectId || typeof b.projectId !== "string" || !b.projectId.trim()) {
    return { ok: false, error: "projectId is required.", field: "projectId" };
  }

  if (!b.inputMessage || typeof b.inputMessage !== "string" || !b.inputMessage.trim()) {
    return { ok: false, error: "inputMessage is required.", field: "inputMessage" };
  }

  if (b.workspaceId !== undefined && (typeof b.workspaceId !== "string" || !b.workspaceId.trim())) {
    return { ok: false, error: "workspaceId must be a non-empty string.", field: "workspaceId" };
  }

  if (b.userId !== undefined && (typeof b.userId !== "string" || !b.userId.trim())) {
    return { ok: false, error: "userId must be a non-empty string.", field: "userId" };
  }

  return {
    ok: true,
    data: {
      projectId: (b.projectId as string).trim(),
      inputMessage: (b.inputMessage as string).trim(),
      workspaceId: b.workspaceId ? (b.workspaceId as string).trim() : undefined,
      userId: b.userId ? (b.userId as string).trim() : undefined,
      projectName:
        typeof b.projectName === "string" && b.projectName.trim()
          ? b.projectName.trim()
          : undefined,
      projectDescription:
        typeof b.projectDescription === "string" && b.projectDescription.trim()
          ? b.projectDescription.trim()
          : undefined,
    },
  };
}

function buildAgentDb(
  c: Context<{ Bindings: Bindings }>,
  body: RunAgentBody,
): BriskAgentDb {
  const geminiApiKey = c.env.GEMINI_API_KEY?.trim();

  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return Object.assign(useDB(c), {
    briskConfig: {
      geminiApiKey,
      workspaceId: body.workspaceId ?? DEFAULT_WORKSPACE_ID,
      userId: body.userId,
      projectName: body.projectName,
      projectDescription: body.projectDescription,
    },
  });
}

export const runAgent = async (c: Context<{ Bindings: Bindings }>) => {
  const raw = await c.req.json().catch(() => null);
  const validation = validateBody(raw);

  if (!validation.ok) {
    return c.json(
      { success: false, error: validation.error, field: validation.field },
      400,
    );
  }

  const body = validation.data;

  let agentDb: BriskAgentDb;

  try {
    agentDb = buildAgentDb(c, body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent configuration failed.";
    return c.json({ success: false, error: message, code: null }, 500);
  }

  const agent = briskAgent(agentDb);

  try {
    const finalState = await agent.invoke({
      messages: [new HumanMessage(body.inputMessage)],
      projectId: body.projectId,
      isStepValid: false,
    });

    if (!finalState.isStepValid) {
      const code = finalState.errorCode ?? null;
      const status = code ? ERROR_HTTP_STATUS[code] : 500;
      return c.json({ success: false, error: code ?? "EXECUTION_FAILED", code }, status);
    }

    const milestoneRows = await agentDb
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, body.projectId));

    const milestones = milestoneRows.filter((row) => row.parentId === null);
    const subtasks = milestoneRows.filter((row) => row.parentId !== null);

    return c.json({
      success: true,
      projectId: finalState.projectId,
      phasesCreated: milestones.length,
      tasksCreated: milestones.length + subtasks.length,
      history: finalState.messages.map((m) => ({
        type: m._getType(),
        content: m.content,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent execution failed.";
    return c.json({ success: false, error: message, code: null }, 500);
  }
};
