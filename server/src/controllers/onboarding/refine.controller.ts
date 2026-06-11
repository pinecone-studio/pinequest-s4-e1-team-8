import type { Context } from "hono";
import { refineSelection } from "../../lib/groq/onboarding-refine";
import type { Bindings, Variables } from "../../lib/common/types";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

type RefineRequestBody = {
  blockTitle?: unknown;
  paragraphContext?: unknown;
  selectedText?: unknown;
  instruction?: unknown;
};

export const postRefineSelection = async (c: Context<HonoEnv>) => {
  const userId = c.get("userId");
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const raw = (await c.req.json().catch(() => null)) as RefineRequestBody | null;
  if (!raw || typeof raw !== "object") {
    return c.json({ error: "Request body must be a JSON object." }, 400);
  }

  const blockTitle = typeof raw.blockTitle === "string" ? raw.blockTitle.trim() : "";
  const paragraphContext =
    typeof raw.paragraphContext === "string" ? raw.paragraphContext : "";
  const selectedText = typeof raw.selectedText === "string" ? raw.selectedText : "";
  const instruction = typeof raw.instruction === "string" ? raw.instruction.trim() : "";

  if (!selectedText.trim()) {
    return c.json({ error: "selectedText is required." }, 400);
  }

  if (!instruction) {
    return c.json({ error: "instruction is required." }, 400);
  }

  try {
    const result = await refineSelection(c.env, {
      blockTitle: blockTitle || "TDD Section",
      paragraphContext,
      selectedText,
      instruction,
    });
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Refinement request failed.";
    return c.json({ error: message }, 502);
  }
};
