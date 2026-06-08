import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import type { SupervisorGraphState } from "../state";

const SYSTEM_PROMPT = `You are an elite onboarding strategist. Read the user's stated goals and craft a tailored onboarding path: a sequence of concrete steps that gets them productive quickly, paired with feature recommendations that match their goals. Focus exclusively on onboarding sequencing and feature fit. Ignore concerns outside of onboarding such as risk analysis or product metrics.`;

type GeminiOnboardingResponse = {
  onboardingPath: unknown;
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

function formatOnboardingMessage(onboardingPath: string[], featureRecommendations: string[]): string {
  const pathSection = onboardingPath.map((step, index) => `${index + 1}. ${step}`).join("\n");
  const featureSection = featureRecommendations.map((feature) => `- ${feature}`).join("\n");
  return `Onboarding path:\n${pathSection}\n\nRecommended features:\n${featureSection}`;
}

export async function onboardingWorkerNode(state: typeof SupervisorGraphState.State) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          onboardingPath: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          featureRecommendations: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ["onboardingPath", "featureRecommendations"],
      },
    },
  });

  const userGoals = extractUserGoals(state.messages);

  let messageContent: string;
  try {
    const result = await model.generateContent(userGoals);
    const parsed: GeminiOnboardingResponse = JSON.parse(result.response.text());
    if (!isStringArray(parsed.onboardingPath) || !isStringArray(parsed.featureRecommendations)) {
      throw new Error("Unexpected onboarding response shape");
    }
    messageContent = formatOnboardingMessage(parsed.onboardingPath, parsed.featureRecommendations);
  } catch {
    messageContent = "Onboarding path generation failed. Defaulting to a standard onboarding flow.";
  }

  return {
    messages: [new AIMessage(messageContent)],
    context: { ...state.context, onboardingComplete: true },
    nextElement: "supervisor",
  };
}
