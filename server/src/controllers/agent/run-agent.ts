import { HumanMessage } from "@langchain/core/messages";
import { Context } from "hono";
import { createBriskAgent } from "../../agent/briskGraph";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";

type RunAgentBody = {
  inputMessage?: string;
  projectId?: string;
};

export const runAgent = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as RunAgentBody | null;

  if (!body?.projectId?.trim()) {
    return c.json({ error: "projectId is required" }, 400);
  }

  if (!body.inputMessage?.trim()) {
    return c.json({ error: "inputMessage is required" }, 400);
  }

  const db = useDB(c);
  const briskAgent = createBriskAgent(db);

  const finalState = await briskAgent.invoke({
    messages: [new HumanMessage(body.inputMessage.trim())],
    projectId: body.projectId.trim(),
    isStepValid: false,
  });

  return c.json({
    success: finalState.isStepValid,
    history: finalState.messages,
  });
};
