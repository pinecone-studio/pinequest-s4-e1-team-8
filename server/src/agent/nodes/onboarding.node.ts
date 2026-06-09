import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { BaseMessage } from "@langchain/core/messages";
import { getGeminiApiKey } from "../agent-bindings";
import type { BriskState, OnboardingPlan } from "../brisk.state";

const SYSTEM_PROMPT = `You are a senior technical onboarding lead. Focus exclusively on the technical setup, architecture maps, and toolchains needed to start this project. Read the provided project description, goals, and constraints, then produce a concrete onboarding plan with actionable setup steps and a realistic time estimate. Ignore concerns outside of technical setup such as KPIs, telemetry, or risk analysis.`;

type GeminiOnboardingResponse = {
  steps: unknown;
  estimatedHours: unknown;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function parseOnboardingPlan(value: GeminiOnboardingResponse): OnboardingPlan {
  if (!isStringArray(value.steps) || typeof value.estimatedHours !== "number") {
    throw new Error("Unexpected onboarding plan response shape");
  }
  return {
    features: value.steps,
    dashboardStrategy: `Complete setup within ${value.estimatedHours} hours`,
  };
}

function extractProjectDescription(messages: BaseMessage[]): string {
  return messages
    .filter((message) => message._getType() === "human")
    .map((message) => (typeof message.content === "string" ? message.content : ""))
    .join("\n")
    .trim();
}

function extractProjectContext(state: typeof BriskState.State) {
  return {
    projectTitle: state.breakdown?.projectTitle ?? null,
    description: extractProjectDescription(state.messages),
    goals:
      state.breakdown?.phases.map((phase) => ({
        name: phase.name,
        description: phase.description ?? null,
      })) ?? [],
    constraints:
      state.breakdown?.phases.flatMap((phase) => phase.tasks.map((task) => task.title)) ?? [],
  };
}

export async function onboardingNode(state: typeof BriskState.State) {
  const genAI = new GoogleGenerativeAI(getGeminiApiKey());

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          steps: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.STRING,
            },
          },
          estimatedHours: {
            type: SchemaType.NUMBER,
          },
        },
        required: ["steps", "estimatedHours"],
      },
    },
  });

  const userContent = JSON.stringify(extractProjectContext(state));

  try {
    const result = await model.generateContent(userContent);
    const parsed: GeminiOnboardingResponse = JSON.parse(result.response.text());
    const onboardingPlan: OnboardingPlan = parseOnboardingPlan(parsed);
    return {
      onboardingPlan,
      nextWorker: null,
    };
  } catch {
    return {
      nextWorker: null,
    };
  }
}
