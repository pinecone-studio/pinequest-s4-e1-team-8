import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import { getGeminiApiKey } from "../agent-bindings";
import { generateGeminiJsonText } from "../gemini-structured";
import type { SupervisorGraphState } from "../state";

const SYSTEM_PROMPT = `You are an elite delivery analytics lead. Read the user's stated goals and compute delivery velocity metrics, sprint milestone tracking, and an operational burn-down summary. Focus exclusively on measurable delivery performance and milestone progress. Ignore concerns outside of metrics such as onboarding sequencing or security risk.`;

type GeminiMetricsResponse = {
  velocityMetrics: unknown;
  sprintMilestones: unknown;
  burnDownSummary: unknown;
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

function formatMetricsMessage(
  velocityMetrics: string[],
  sprintMilestones: string[],
  burnDownSummary: string,
): string {
  const velocitySection = velocityMetrics.map((metric) => `- ${metric}`).join("\n");
  const milestoneSection = sprintMilestones
    .map((milestone, index) => `${index + 1}. ${milestone}`)
    .join("\n");
  return `Metrics report:\n\nDelivery velocity:\n${velocitySection}\n\nSprint milestones:\n${milestoneSection}\n\nBurn-down summary:\n${burnDownSummary}`;
}

export async function metricsWorkerNode(state: typeof SupervisorGraphState.State) {
  const genAI = new GoogleGenerativeAI(getGeminiApiKey());

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          velocityMetrics: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          sprintMilestones: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          burnDownSummary: {
            type: SchemaType.STRING,
          },
        },
        required: ["velocityMetrics", "sprintMilestones", "burnDownSummary"],
      },
    },
  });

  const userGoals = extractUserGoals(state.messages);

  let messageContent: string;
  try {
    const responseText = await generateGeminiJsonText(model, userGoals);
    const parsed: GeminiMetricsResponse = JSON.parse(responseText);
    if (
      !isStringArray(parsed.velocityMetrics) ||
      !isStringArray(parsed.sprintMilestones) ||
      typeof parsed.burnDownSummary !== "string"
    ) {
      throw new Error("Unexpected metrics response shape");
    }
    messageContent = formatMetricsMessage(
      parsed.velocityMetrics,
      parsed.sprintMilestones,
      parsed.burnDownSummary,
    );
  } catch {
    messageContent =
      "Metrics analysis failed. Defaulting to a standard metrics placeholder report.";
  }

  return {
    messages: [new AIMessage(messageContent)],
    context: { ...state.context, metricsAnalyzed: true },
    nextElement: "supervisor",
  };
}
