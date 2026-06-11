import type { Context } from "hono";
import {
  generateScopingTurn,
  type ScopingChatMessage,
} from "../../lib/groq/onboarding-scoping";
import type { Bindings, Variables } from "../../lib/common/types";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

type ScopingRequestBody = {
  projectName?: unknown;
  description?: unknown;
  messages?: unknown;
  tddContext?: unknown;
};

function isScopingChatMessage(value: unknown): value is ScopingChatMessage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    (record.role === "user" || record.role === "assistant") &&
    typeof record.content === "string"
  );
}

export const postScopingTurn = async (c: Context<HonoEnv>) => {
  const userId = c.get("userId");
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const raw = (await c.req.json().catch(() => null)) as ScopingRequestBody | null;
  if (!raw || typeof raw !== "object") {
    return c.json({ error: "Request body must be a JSON object." }, 400);
  }

  const projectName = typeof raw.projectName === "string" ? raw.projectName.trim() : "";
  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  const tddContext = typeof raw.tddContext === "string" ? raw.tddContext.trim() : "";
  const messages = Array.isArray(raw.messages)
    ? raw.messages.filter(isScopingChatMessage)
    : [];

  if (!projectName || (!description && !tddContext)) {
    return c.json({ error: "projectName and description (or tddContext) are required." }, 400);
  }

  try {
    const result = await generateScopingTurn(
      c.env,
      projectName,
      description,
      messages,
      tddContext || undefined,
    );
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scoping request failed.";
    return c.json({ error: message }, 502);
  }
};
