import type { Bindings } from "../common/types";

const GEMINI_MODEL = "gemini-2.5-flash";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

export type GeminiJsonRequest = {
  systemPrompt?: string;
  userPrompt: string;
  model?: string;
};

function resolveGeminiModel(_bindings: Bindings, override?: string): string {
  return override?.trim() || GEMINI_MODEL;
}

function extractGeminiText(data: GeminiResponse): string | undefined {
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

function tryParseJson(candidate: string): unknown {
  return JSON.parse(candidate.trim());
}

export function parseJsonFromGeminiText(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new SyntaxError("Empty Gemini response");
  }

  try {
    return tryParseJson(trimmed);
  } catch {
    // Continue with fallbacks.
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch) {
    return tryParseJson(fencedMatch[1]);
  }

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd > objectStart) {
    return tryParseJson(trimmed.slice(objectStart, objectEnd + 1));
  }

  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    return tryParseJson(trimmed.slice(arrayStart, arrayEnd + 1));
  }

  throw new SyntaxError("Gemini response did not contain parseable JSON");
}

export async function generateGeminiText(
  bindings: Bindings,
  prompt: string,
): Promise<string> {
  const apiKey = bindings.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${resolveGeminiModel(bindings)}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  );

  const data = (await response.json()) as GeminiResponse;
  const text = extractGeminiText(data);

  if (!response.ok || !text) {
    throw new Error(data.error?.message ?? "Gemini request failed");
  }

  return text;
}

export async function generateGeminiJson(
  bindings: Bindings,
  params: GeminiJsonRequest,
): Promise<string> {
  const apiKey = bindings.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: params.userPrompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  };

  if (params.systemPrompt?.trim()) {
    body.systemInstruction = { parts: [{ text: params.systemPrompt.trim() }] };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${resolveGeminiModel(bindings, params.model)}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const data = (await response.json()) as GeminiResponse;
  const text = extractGeminiText(data);

  if (!response.ok || !text) {
    throw new Error(data.error?.message ?? "Gemini request failed");
  }

  return text;
}

