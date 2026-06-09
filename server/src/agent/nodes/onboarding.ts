import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import { getGeminiApiKey } from "../agent-bindings";
import { generateGeminiJsonText } from "../gemini-structured";
import type { SupervisorGraphState } from "../state";

const SYSTEM_PROMPT = `You are an elite onboarding strategist. Read the user's stated goals and craft a tailored onboarding path: a sequence of concrete steps that gets them productive quickly, paired with feature recommendations that match their goals. Focus exclusively on onboarding sequencing and feature fit. Ignore concerns outside of onboarding such as risk analysis or product metrics.`;

type GeminiOnboardingResponse = {
  title: unknown;
  overview: unknown;
  onboardingSteps: unknown;
  featureRecommendations: unknown;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function extractUserGoals(messages: BaseMessage[]): string {
  return messages
    .filter((message) => message._getType() === "human")
    .map((message) => (typeof message.content === "string" ? message.content : ""))
    .join("\n")
    .trim();
}

function formatOnboardingMessage(
  title: string,
  overview: string,
  onboardingSteps: string[],
  featureRecommendations: string[],
): string {
  const pathSection = onboardingSteps.map((step, index) => `${index + 1}. ${step}`).join("\n");
  const featureSection = featureRecommendations.map((feature) => `- ${feature}`).join("\n");
  return `# ${title}

## Overview
${overview}

## Onboarding Steps
${pathSection}

## Recommended Features
${featureSection}`;
}

export async function onboardingWorkerNode(state: typeof SupervisorGraphState.State) {
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
          onboardingSteps: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          featureRecommendations: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ["title", "overview", "onboardingSteps", "featureRecommendations"],
      },
    },
  });

  const userGoals = extractUserGoals(state.messages);

  let messageContent: string;
  try {
    const responseText = await generateGeminiJsonText(model, userGoals);
    const parsed: GeminiOnboardingResponse = JSON.parse(responseText);
    if (
      typeof parsed.title !== "string" ||
      typeof parsed.overview !== "string" ||
      !isStringArray(parsed.onboardingSteps) ||
      !isStringArray(parsed.featureRecommendations)
    ) {
      throw new Error("Unexpected onboarding response shape");
    }
    messageContent = formatOnboardingMessage(
      parsed.title,
      parsed.overview,
      parsed.onboardingSteps,
      parsed.featureRecommendations,
    );
  } catch {
    messageContent = "Onboarding path generation failed. Defaulting to a standard onboarding flow.";
  }

  return {
    messages: [new AIMessage(messageContent)],
    context: { ...state.context, onboardingComplete: true },
    nextElement: "supervisor",
  };
}
