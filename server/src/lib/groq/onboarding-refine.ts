import type { Bindings } from "../common/types";
import { generateGeminiJson, parseJsonFromGeminiText } from "../gemini/gemini-client";

export type RefineSelectionParams = {
  blockTitle: string;
  paragraphContext: string;
  selectedText: string;
  instruction: string;
};

export type RefineSelectionResult = {
  refinedText: string;
};

const REFINE_SYSTEM_PROMPT =
  "You are a technical writing assistant refining sections of a TDD document. " +
  "Apply the user's instruction to the selected text while preserving markdown structure. " +
  "Always reply with strict JSON only.";

function buildRefinePrompt(params: RefineSelectionParams): string {
  return [
    `Section: ${params.blockTitle}`,
    `Surrounding context:\n${params.paragraphContext}`,
    `Selected text:\n${params.selectedText}`,
    `Instruction: ${params.instruction}`,
    'Respond with ONLY: {"refinedText": "<replacement markdown for the selected portion>"}',
    "Rules: Return only the refined replacement for the selected text, not the full section.",
  ].join("\n\n");
}

export async function refineSelection(
  bindings: Bindings,
  params: RefineSelectionParams,
): Promise<RefineSelectionResult> {
  if (!params.selectedText.trim()) {
    throw new Error("selectedText is required.");
  }

  const text = await generateGeminiJson(bindings, {
    systemPrompt: REFINE_SYSTEM_PROMPT,
    userPrompt: buildRefinePrompt(params),
  });

  let parsed: unknown;
  try {
    parsed = parseJsonFromGeminiText(text);
  } catch {
    throw new Error("Refinement response was not valid JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Refinement response was not a JSON object.");
  }

  const record = parsed as Record<string, unknown>;
  const refinedText =
    typeof record.refinedText === "string" && record.refinedText.trim()
      ? record.refinedText.trim()
      : params.selectedText;

  return { refinedText };
}

export const REFINE_QUICK_ACTIONS = [
  { id: "rewrite", label: "Rewrite", instruction: "Rewrite for clarity and executive tone." },
  { id: "expand", label: "Expand", instruction: "Expand with more technical detail and examples." },
  { id: "simplify", label: "Simplify", instruction: "Simplify language while keeping technical accuracy." },
  { id: "edge-cases", label: "Edge cases", instruction: "Add edge cases and failure modes." },
] as const;
