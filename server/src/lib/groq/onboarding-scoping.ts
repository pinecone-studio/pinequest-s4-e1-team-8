import type { Bindings } from "../common/types";
import { generateGeminiJson, parseJsonFromGeminiText } from "../gemini/gemini-client";

export type ScopingChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ScopingMilestoneResult = {
  title: string;
  tasks: string[];
};

export type ScopingClarificationResult = {
  isClarification: true;
  message: string;
  suggestions: string[];
};

export type ScopingFinalResult = {
  isClarification: false;
  message: string;
  milestones: ScopingMilestoneResult[];
};

export type ScopingResult = ScopingClarificationResult | ScopingFinalResult;

const MAX_CLARIFICATION_ROUNDS = 2;
const MAX_TDD_CONTEXT_CHARS = 24_000;

const SCOPING_SYSTEM_PROMPT =
  "You are a senior product strategist helping a founder scope a new software project through a short " +
  "conversational interview. Always reply with strict JSON only — no markdown, no commentary, no code fences.";

function truncateTddContext(tddContext: string): string {
  const trimmed = tddContext.trim();
  if (trimmed.length <= MAX_TDD_CONTEXT_CHARS) {
    return trimmed;
  }
  return `${trimmed.slice(0, MAX_TDD_CONTEXT_CHARS)}\n\n[Document truncated for length.]`;
}

function buildScopingPrompt(
  projectName: string,
  description: string,
  messages: ScopingChatMessage[],
  tddContext?: string,
): string {
  const assistantTurns = messages.filter((message) => message.role === "assistant").length;
  const hasTddContext = Boolean(tddContext?.trim());
  const mustFinalize = hasTddContext || assistantTurns >= MAX_CLARIFICATION_ROUNDS;

  const transcript = messages
    .map((message) => `${message.role === "user" ? "Founder" : "You"}: ${message.content}`)
    .join("\n");

  const sections = [
    `Project title: ${projectName || "Untitled project"}`,
    `Project idea: ${description || "No description provided yet."}`,
  ];

  if (hasTddContext) {
    sections.push(
      "Finalized TDD document (derive milestones directly from the features and test cases below):",
      truncateTddContext(tddContext!),
    );
  }

  sections.push(
    transcript ? `Conversation so far:\n${transcript}` : "Conversation so far: (none yet)",
    hasTddContext
      ? "A finalized TDD is provided. You MUST finalize now (isClarification: false) and produce 3-5 milestones that map to the TDD scope. Do not ask clarifying questions."
      : mustFinalize
        ? "You have already asked enough clarifying questions. You MUST finalize now (isClarification: false) using reasonable assumptions for anything still unclear."
        : `You may ask up to ${MAX_CLARIFICATION_ROUNDS - assistantTurns} more clarifying question(s) if genuinely needed, or finalize now if you already have enough information.`,
    "Respond with ONLY a JSON object, no markdown fences, matching exactly one of these shapes:",
    '{"isClarification": true, "message": "<one short clarifying question>", "suggestions": ["<short answer option>", "..."]}',
    "OR",
    '{"isClarification": false, "message": "<one short summary sentence>", "milestones": [{"title": "<milestone title>", "tasks": ["<task>", "..."]}]}',
    'Rules: "suggestions" must contain 2-4 short example answers (max ~6 words each). "milestones" must contain 3-5 items, each with 2-5 concrete, actionable tasks.',
  );

  return sections.join("\n\n");
}

function coerceBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }
  return undefined;
}

function normalizeStringArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, max);
}

function normalizeMilestones(value: unknown): ScopingMilestoneResult[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item): ScopingMilestoneResult | null => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const record = item as Record<string, unknown>;
      const title = typeof record.title === "string" ? record.title.trim() : "";
      if (!title) {
        return null;
      }
      return { title, tasks: normalizeStringArray(record.tasks, 8) };
    })
    .filter((item): item is ScopingMilestoneResult => item !== null)
    .slice(0, 5);
}

function normalizeScopingResult(raw: unknown): ScopingResult {
  if (!raw || typeof raw !== "object") {
    throw new Error("Groq scoping response was not a JSON object.");
  }

  const record = raw as Record<string, unknown>;
  const message = typeof record.message === "string" ? record.message.trim() : "";
  const isClarification = coerceBoolean(record.isClarification);

  if (isClarification === false) {
    const milestones = normalizeMilestones(record.milestones);
    if (milestones.length === 0) {
      throw new Error("Groq scoping response did not include any milestones.");
    }
    return {
      isClarification: false,
      message: message || "Here is your milestone breakdown.",
      milestones,
    };
  }

  return {
    isClarification: true,
    message: message || "Could you share a bit more detail about your project?",
    suggestions: normalizeStringArray(record.suggestions, 4),
  };
}

function parseScopingResponse(text: string): ScopingResult {
  let parsed: unknown;
  try {
    parsed = parseJsonFromGeminiText(text);
  } catch {
    throw new Error("Scoping response was not valid JSON.");
  }

  return normalizeScopingResult(parsed);
}

export async function generateScopingTurn(
  bindings: Bindings,
  projectName: string,
  description: string,
  messages: ScopingChatMessage[],
  tddContext?: string,
): Promise<ScopingResult> {
  const userPrompt = buildScopingPrompt(projectName, description, messages, tddContext);

  const requestScoping = (prompt: string) =>
    generateGeminiJson(bindings, {
      systemPrompt: SCOPING_SYSTEM_PROMPT,
      userPrompt: prompt,
    });

  try {
    const text = await requestScoping(userPrompt);
    return parseScopingResponse(text);
  } catch (firstError) {
    const text = await requestScoping(
      `${userPrompt}\n\nIMPORTANT: Your previous reply was not valid JSON. Return ONLY a single JSON object matching one of the required shapes.`,
    );
    try {
      return parseScopingResponse(text);
    } catch {
      throw firstError;
    }
  }
}
