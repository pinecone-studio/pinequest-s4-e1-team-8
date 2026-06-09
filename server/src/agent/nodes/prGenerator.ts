import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import { getGeminiApiKey } from "../agent-bindings";
import type { SupervisorGraphState } from "../state";

const SYSTEM_PROMPT = `You are an elite pull request author. Analyze git diff strings, code additions, and structural modifications supplied by the user, then produce a clean professional pull request title and a detailed markdown description. Focus exclusively on summarizing code changes for reviewers. Ignore concerns outside of pull request authoring such as onboarding, metrics, or risk analysis.`;

const FALLBACK_PR_MARKDOWN = `# Pull Request

## Overview
PR generation failed. A placeholder template is provided for manual completion.

## Changes Included
- Review and document code changes from the supplied diff

## Verification
- Run the test suite
- Manually verify the affected behavior`;

type GeminiPrResponse = {
  title: unknown;
  overview: unknown;
  changesIncluded: unknown;
  verificationSteps: unknown;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function extractDiffInput(messages: BaseMessage[]): string {
  return messages
    .filter((message) => message._getType() === "human")
    .map((message) => (typeof message.content === "string" ? message.content : ""))
    .join("\n")
    .trim();
}

function formatPrMarkdown(
  title: string,
  overview: string,
  changesIncluded: string[],
  verificationSteps: string[],
): string {
  const changesSection = changesIncluded.map((change) => `- ${change}`).join("\n");
  const verificationSection = verificationSteps.map((step) => `- ${step}`).join("\n");
  return `# ${title}

## Overview
${overview}

## Changes Included
${changesSection}

## Verification
${verificationSection}`;
}

export async function prGeneratorWorkerNode(state: typeof SupervisorGraphState.State) {
  const genAI = new GoogleGenerativeAI(getGeminiApiKey());

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          title: {
            type: SchemaType.STRING,
          },
          overview: {
            type: SchemaType.STRING,
          },
          changesIncluded: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          verificationSteps: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ["title", "overview", "changesIncluded", "verificationSteps"],
      },
    },
  });

  const diffInput = extractDiffInput(state.messages);

  let messageContent: string;
  try {
    const result = await model.generateContent(diffInput);
    const parsed: GeminiPrResponse = JSON.parse(result.response.text());
    if (
      typeof parsed.title !== "string" ||
      typeof parsed.overview !== "string" ||
      !isStringArray(parsed.changesIncluded) ||
      !isStringArray(parsed.verificationSteps)
    ) {
      throw new Error("Unexpected PR generator response shape");
    }
    messageContent = formatPrMarkdown(
      parsed.title,
      parsed.overview,
      parsed.changesIncluded,
      parsed.verificationSteps,
    );
  } catch {
    messageContent = FALLBACK_PR_MARKDOWN;
  }

  return {
    messages: [new AIMessage(messageContent)],
    context: { ...state.context, prGenerated: true },
    nextElement: "supervisor",
  };
}
