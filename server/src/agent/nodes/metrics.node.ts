import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { BaseMessage } from "@langchain/core/messages";
import { getGeminiApiKey } from "../agent-bindings";
import type { BriskState, MetricsReport } from "../brisk.state";

const SYSTEM_PROMPT = `You are a senior product analytics lead. Focus exclusively on defining core KPIs, tracking telemetry benchmarks, and setting release success targets for this project. Read the provided project description, goals, and constraints, then produce a measurable metrics report. Ignore concerns outside of metrics such as technical onboarding or security risk.`;

type GeminiMetricsResponse = {
  kpis: unknown;
  targetMetrics: unknown;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function parseMetricsReport(value: GeminiMetricsResponse): MetricsReport {
  if (!isStringArray(value.kpis) || typeof value.targetMetrics !== "string") {
    throw new Error("Unexpected metrics report response shape");
  }
  return {
    projectAnalytics: { kpiCount: value.kpis.length },
    milestoneVelocity: value.kpis.length,
    progressEstimates: { completionTarget: value.targetMetrics.length },
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

export async function metricsNode(state: typeof BriskState.State) {
  const genAI = new GoogleGenerativeAI(getGeminiApiKey());

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          kpis: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.STRING,
            },
          },
          targetMetrics: {
            type: SchemaType.STRING,
          },
        },
        required: ["kpis", "targetMetrics"],
      },
    },
  });

  const userContent = JSON.stringify(extractProjectContext(state));

  try {
    const result = await model.generateContent(userContent);
    const parsed: GeminiMetricsResponse = JSON.parse(result.response.text());
    const metricsReport: MetricsReport = parseMetricsReport(parsed);
    return {
      metricsReport,
      nextWorker: null,
    };
  } catch {
    return {
      nextWorker: null,
    };
  }
}
