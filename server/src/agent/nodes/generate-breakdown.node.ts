import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import type { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { parseBreakdownFromContent } from "../breakdown.types";
import type { BriskState } from "../brisk.state";
import type { BriskAgentRuntime } from "../brisk.types";

const SYSTEM_PROMPT = `You are an Elite Multi-Industry Senior Project Manager.

Your job is to transform a user's unstructured onboarding goal into a practical delivery plan.  Analyze the goal and infer the domain (software, school group project, marketing campaign, research, operations, event planning, or similar).
Use domain-appropriate phase labels:
- Software: features, epics, or delivery phases
- School or academic work: subjects, modules, or assignment phases
- Marketing or creative work: campaigns, deliverables, or production stages
- Operations or events: workstreams, checkpoints, or logistics phases

Return ONLY valid JSON with this exact shape:
{
  "projectTitle": "Concise project title",
  "phases": [
    {
      "name": "Phase or milestone name",
      "description": "What this phase accomplishes",
      "tasks": [
        {
          "title": "Actionable task title",
          "description": "Clear execution detail",
          "priority": "LOW|MEDIUM|HIGH|URGENT",
          "status": "BACKLOG|TODO"
        }
      ]
    }
  ]
}

Rules:
- Produce 3 to 6 phases.
- Each phase must contain 2 to 5 tasks.
- Tasks must be concrete, assignable, and stakeholder-ready.
- Use status BACKLOG for future work and TODO for immediate next actions.
- Do not include markdown, commentary, or extra keys.`;

function extractUserMessage(messages: BaseMessage[]): string {
  return messages
    .filter((m) => m._getType() === "human")
    .map((m) => (typeof m.content === "string" ? m.content : ""))
    .join("\n")
    .trim();
}

export const createGenerateBreakdownNode =
  (model: ChatGoogleGenerativeAI, config: BriskAgentRuntime) =>
  async (state: typeof BriskState.State) => {
    const userGoal = extractUserMessage(state.messages);

    if (!userGoal) {
      return {
        breakdown: null,
        isStepValid: false,
        errorCode: "MODEL_FAILURE" as const,
        retryCount: state.retryCount + 1,
        messages: [
          new AIMessage("Execution failed: No onboarding goal was provided."),
        ],
      };
    }

    const retryHint =
      state.retryCount > 0
        ? `\nPrevious attempt failed validation. Ensure exactly 3-6 phases, each with 2-5 actionable tasks.`
        : null;

    const contextLines = [
      config.projectName ? `Project name: ${config.projectName}` : null,
      config.projectDescription
        ? `Project description: ${config.projectDescription}`
        : null,
      `User goal: ${userGoal}`,
      retryHint,
    ].filter((line): line is string => line !== null);

    const response = await model.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(contextLines.join("\n")),
    ]);

    const content =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    const breakdown = parseBreakdownFromContent(content);

    if (!breakdown) {
      return {
        breakdown: null,
        isStepValid: false,
        errorCode: "MODEL_FAILURE" as const,
        retryCount: state.retryCount + 1,
        messages: [
          new AIMessage("Execution failed: Model response was not valid JSON."),
        ],
      };
    }

    const taskCount = breakdown.phases.reduce((n, p) => n + p.tasks.length, 0);

    return {
      breakdown,
      isStepValid: true,
      errorCode: null,
      messages: [
        new AIMessage(
          `Generated ${breakdown.phases.length} phases with ${taskCount} tasks.`,
        ),
      ],
    };
  };
