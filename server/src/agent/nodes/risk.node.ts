import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { BaseMessage } from "@langchain/core/messages";
import { getGeminiApiKey } from "../agent-bindings";
import type { BriskState, RiskAnalysis } from "../brisk.state";

const SYSTEM_PROMPT = `You are a senior security and infrastructure risk lead. Focus exclusively on identifying security vulnerabilities, infrastructure bottlenecks, and deployment risk mitigations for this project. Read the provided project description, goals, and constraints, then produce a concrete risk analysis. Ignore concerns outside of risk such as technical onboarding or product metrics.`;

type GeminiRiskResponse = {
  threats: unknown;
  mitigationStrategies: unknown;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function parseRiskAnalysis(value: GeminiRiskResponse): RiskAnalysis {
  if (!isStringArray(value.threats) || !isStringArray(value.mitigationStrategies)) {
    throw new Error("Unexpected risk analysis response shape");
  }
  return {
    timelineBottlenecks: value.threats,
    riskAssessments: value.mitigationStrategies,
    blockers: value.threats,
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

export async function riskNode(state: typeof BriskState.State) {
  const genAI = new GoogleGenerativeAI(getGeminiApiKey());

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          threats: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.STRING,
            },
          },
          mitigationStrategies: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.STRING,
            },
          },
        },
        required: ["threats", "mitigationStrategies"],
      },
    },
  });

  const userContent = JSON.stringify(extractProjectContext(state));

  try {
    const result = await model.generateContent(userContent);
    const parsed: GeminiRiskResponse = JSON.parse(result.response.text());
    const riskAnalysis: RiskAnalysis = parseRiskAnalysis(parsed);
    return {
      riskAnalysis,
      nextWorker: null,
    };
  } catch {
    return {
      nextWorker: null,
    };
  }
}
