import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import { getGeminiApiKey } from "../agent-bindings";
import type { SupervisorGraphState } from "../state";

const SYSTEM_PROMPT = `You are an elite GitHub issue author. Transform messy, informal, or unstructured user requests into high-quality actionable GitHub issues. Produce a clear issue title and a structured markdown body. Focus exclusively on issue authoring. Ignore concerns outside of GitHub issue creation such as onboarding, metrics, risk analysis, or pull request writing.`;

const FALLBACK_ISSUE_MARKDOWN = `# GitHub Issue

## Overview
Issue generation failed. A placeholder template is provided for manual completion.

## User Stories / Requirements
- Capture the user's core problem or feature request

## Acceptance Criteria
- Define measurable completion criteria for this issue`;

type GeminiIssueResponse = {
  title: unknown;
  overview: unknown;
  userStoriesOrRequirements: unknown;
  acceptanceCriteria: unknown;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function extractUserRequest(messages: BaseMessage[]): string {
  return messages
    .filter((message) => message._getType() === "human")
    .map((message) => (typeof message.content === "string" ? message.content : ""))
    .join("\n")
    .trim();
}

function formatIssueMarkdown(
  title: string,
  overview: string,
  userStoriesOrRequirements: string[],
  acceptanceCriteria: string[],
): string {
  const requirementsSection = userStoriesOrRequirements
    .map((requirement) => `- ${requirement}`)
    .join("\n");
  const criteriaSection = acceptanceCriteria.map((criterion) => `- ${criterion}`).join("\n");
  return `# ${title}

## Overview
${overview}

## User Stories / Requirements
${requirementsSection}

## Acceptance Criteria
${criteriaSection}`;
}

export async function issueGeneratorWorkerNode(state: typeof SupervisorGraphState.State) {
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
          userStoriesOrRequirements: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          acceptanceCriteria: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ["title", "overview", "userStoriesOrRequirements", "acceptanceCriteria"],
      },
    },
  });

  const userRequest = extractUserRequest(state.messages);

  let messageContent: string;
  try {
    const result = await model.generateContent(userRequest);
    const parsed: GeminiIssueResponse = JSON.parse(result.response.text());
    if (
      typeof parsed.title !== "string" ||
      typeof parsed.overview !== "string" ||
      !isStringArray(parsed.userStoriesOrRequirements) ||
      !isStringArray(parsed.acceptanceCriteria)
    ) {
      throw new Error("Unexpected issue generator response shape");
    }
    messageContent = formatIssueMarkdown(
      parsed.title,
      parsed.overview,
      parsed.userStoriesOrRequirements,
      parsed.acceptanceCriteria,
    );
  } catch {
    messageContent = FALLBACK_ISSUE_MARKDOWN;
  }

  return {
    messages: [new AIMessage(messageContent)],
    context: { ...state.context, issueGenerated: true },
    nextElement: "supervisor",
  };
}
