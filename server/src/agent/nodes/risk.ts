import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import { getGeminiApiKey } from "../agent-bindings";
import { generateGeminiJsonText } from "../gemini-structured";
import type { SupervisorGraphState } from "../state";

const SYSTEM_PROMPT = `You are an elite risk management lead. Read the user's stated goals and craft a risk management analysis covering potential project blockers, scope-creep risk factors, and critical dependencies. Focus exclusively on delivery risk, scope control, and dependency exposure. Ignore concerns outside of risk such as onboarding sequencing or delivery metrics.`;

type GeminiRiskResponse = {
  projectBlockers: unknown;
  scopeCreepRisks: unknown;
  dependencies: unknown;
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

function formatRiskMessage(
  projectBlockers: string[],
  scopeCreepRisks: string[],
  dependencies: string,
): string {
  const blockerSection = projectBlockers.map((blocker) => `- ${blocker}`).join("\n");
  const scopeSection = scopeCreepRisks.map((risk) => `- ${risk}`).join("\n");
  return `Risk management report:\n\nProject blockers:\n${blockerSection}\n\nScope-creep risks:\n${scopeSection}\n\nDependencies:\n${dependencies}`;
}

export async function riskWorkerNode(state: typeof SupervisorGraphState.State) {
  const genAI = new GoogleGenerativeAI(getGeminiApiKey());

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          projectBlockers: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          scopeCreepRisks: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          dependencies: {
            type: SchemaType.STRING,
          },
        },
        required: ["projectBlockers", "scopeCreepRisks", "dependencies"],
      },
    },
  });

  const userGoals = extractUserGoals(state.messages);

  let messageContent: string;
  try {
    const responseText = await generateGeminiJsonText(model, userGoals);
    const parsed: GeminiRiskResponse = JSON.parse(responseText);
    if (
      !isStringArray(parsed.projectBlockers) ||
      !isStringArray(parsed.scopeCreepRisks) ||
      typeof parsed.dependencies !== "string"
    ) {
      throw new Error("Unexpected risk response shape");
    }
    messageContent = formatRiskMessage(
      parsed.projectBlockers,
      parsed.scopeCreepRisks,
      parsed.dependencies,
    );
  } catch {
    messageContent =
      "Risk analysis failed. Defaulting to a standard risk management placeholder report.";
  }

  return {
    messages: [new AIMessage(messageContent)],
    context: { ...state.context, risksIdentified: true },
    nextElement: "supervisor",
  };
}
