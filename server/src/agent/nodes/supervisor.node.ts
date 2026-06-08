import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { BriskState, NextWorker } from "../brisk.state";

type RouterWorker = Extract<NextWorker, "ONBOARDING" | "METRICS" | "RISK" | "FINALIZE">;

type GeminiRouterResponse = {
  nextWorker: unknown;
  reasoning: unknown;
};

function parseRouterWorker(value: unknown): RouterWorker {
  if (
    value === "ONBOARDING" ||
    value === "METRICS" ||
    value === "RISK" ||
    value === "FINALIZE"
  ) {
    return value;
  }
  throw new Error(`Unexpected nextWorker value: ${String(value)}`);
}

const SYSTEM_PROMPT = `You are a project orchestration supervisor. Read the incoming project state and determine which worker node to execute next based on these routing rules:

- Route to "ONBOARDING" if onboardingPlan is null.
- Route to "METRICS" if onboardingPlan is populated but metricsReport is null.
- Route to "RISK" if onboardingPlan and metricsReport are populated but riskAnalysis is null.
- Route to "FINALIZE" only when onboardingPlan, metricsReport, and riskAnalysis are all populated.`;

export async function supervisorNode(state: typeof BriskState.State) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          nextWorker: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["ONBOARDING", "METRICS", "RISK", "FINALIZE"],
          },
          reasoning: {
            type: SchemaType.STRING,
          },
        },
        required: ["nextWorker", "reasoning"],
      },
    },
  });

  const userContent = JSON.stringify({
    projectTitle: state.breakdown?.projectTitle,
    onboardingPlan: state.onboardingPlan,
    metricsReport: state.metricsReport,
    riskAnalysis: state.riskAnalysis,
  });

  try {
    const result = await model.generateContent(userContent);
    const parsed: GeminiRouterResponse = JSON.parse(result.response.text());
    const nextWorker = parseRouterWorker(parsed.nextWorker);
    return { nextWorker };
  } catch {
    const fallback: RouterWorker = "ONBOARDING";
    return { nextWorker: fallback };
  }
}
