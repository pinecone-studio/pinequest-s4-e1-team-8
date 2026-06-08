import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import type { SupervisorGraphState } from "../state";

const SYSTEM_PROMPT = `You are an elite delivery analytics lead. Read the user's stated goals and current project context, then compute delivery velocity metrics, sprint milestone tracking, and an operational burn-down summary. Focus exclusively on measurable delivery performance and milestone progress. Ignore concerns outside of metrics such as onboarding sequencing or security risk.`;

type GeminiMetricsResponse = {
  deliveryVelocityMetrics: unknown;
  sprintMilestones: unknown;
  burnDownSummary: unknown;
};
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}
function extractUserGoals(messages: BaseMessage[]): string {
  return messages
    .filter((message) => message._getType() === "human")
    .map((message) =>
      typeof message.content === "string" ? message.content : "",
    )
    .join("\n")
    .trim();
}
function buildMetricsInput(state: typeof SupervisorGraphState.State): string {
  return JSON.stringify({
    context: state.context,
    userGoals: extractUserGoals(state.messages),
    conversationSummary: state.messages
      .map((message) => ({
        role: message._getType(),
        content: typeof message.content === "string" ? message.content : "",
      }))
      .filter((entry) => entry.content.length > 0),
  });
}

function formatMetricsMessage(
  deliveryVelocityMetrics: string[],
  sprintMilestones: string[],
  burnDownSummary: string,
): string {
  const velocitySection = deliveryVelocityMetrics
    .map((metric) => `- ${metric}`)
    .join("\n");
  const milestoneSection = sprintMilestones
    .map((milestone, index) => `${index + 1}. ${milestone}`)
    .join("\n");
  return `Metrics report:\n\nDelivery velocity:\n${velocitySection}\n\nSprint milestones:\n${milestoneSection}\n\nBurn-down summary:\n${burnDownSummary}`;
}

export async function metricsWorkerNode(
  state: typeof SupervisorGraphState.State,
) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          deliveryVelocityMetrics: {
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
        required: [
          "deliveryVelocityMetrics",
          "sprintMilestones",
          "burnDownSummary",
        ],
      },
    },
  });

  const userContent = buildMetricsInput(state);

  let messageContent: string;
  try {
    const result = await model.generateContent(userContent);
    const parsed: GeminiMetricsResponse = JSON.parse(result.response.text());
    if (
      !isStringArray(parsed.deliveryVelocityMetrics) ||
      !isStringArray(parsed.sprintMilestones) ||
      typeof parsed.burnDownSummary !== "string"
    ) {
      throw new Error("Unexpected metrics response shape");
    }
    messageContent = formatMetricsMessage(
      parsed.deliveryVelocityMetrics,
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
