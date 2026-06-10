import type { Bindings } from "../common/types";

const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function resolveGroqModel(bindings: Bindings): string {
  return bindings.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
}

type GroqResponse = {
  choices?: Array<{
    message?: { content?: string };
  }>;
  error?: { message?: string };
};

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

const SCOPING_SYSTEM_PROMPT =
  "You are a senior product strategist helping a founder scope a new software project through a short " +
  "conversational interview. Always reply with strict JSON only — no markdown, no commentary, no code fences.";

function buildScopingPrompt(
  projectName: string,
  description: string,
  messages: ScopingChatMessage[],
): string {
  const assistantTurns = messages.filter((message) => message.role === "assistant").length;
  const mustFinalize = assistantTurns >= MAX_CLARIFICATION_ROUNDS;

  const transcript = messages
    .map((message) => `${message.role === "user" ? "Founder" : "You"}: ${message.content}`)
    .join("\n");

  return [
    `Project title: ${projectName || "Untitled project"}`,
    `Project idea: ${description || "No description provided yet."}`,
    transcript ? `Conversation so far:\n${transcript}` : "Conversation so far: (none yet)",
    mustFinalize
      ? "You have already asked enough clarifying questions. You MUST finalize now (isClarification: false) using reasonable assumptions for anything still unclear."
      : `You may ask up to ${MAX_CLARIFICATION_ROUNDS - assistantTurns} more clarifying question(s) if genuinely needed, or finalize now if you already have enough information.`,
    "Respond with ONLY a JSON object, no markdown fences, matching exactly one of these shapes:",
    '{"isClarification": true, "message": "<one short clarifying question>", "suggestions": ["<short answer option>", "..."]}',
    "OR",
    '{"isClarification": false, "message": "<one short summary sentence>", "milestones": [{"title": "<milestone title>", "tasks": ["<task>", "..."]}]}',
    'Rules: "suggestions" must contain 2-4 short example answers (max ~6 words each). "milestones" must contain 3-5 items, each with 2-5 concrete, actionable tasks.',
  ].join("\n\n");
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

  if (record.isClarification === false) {
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

export async function generateScopingTurn(
  bindings: Bindings,
  projectName: string,
  description: string,
  messages: ScopingChatMessage[],
): Promise<ScopingResult> {
  const apiKey = bindings.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Groq API key is not configured");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: resolveGroqModel(bindings),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SCOPING_SYSTEM_PROMPT },
        { role: "user", content: buildScopingPrompt(projectName, description, messages) },
      ],
    }),
  });

  const data = (await response.json()) as GroqResponse;
  const text = data.choices?.[0]?.message?.content?.trim();

  if (!response.ok || !text) {
    throw new Error(data.error?.message ?? "Groq request failed");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Groq scoping response was not valid JSON.");
  }

  return normalizeScopingResult(parsed);
}
