import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { getDrizzleDb } from "../lib/db/db";
import { DEFAULT_WORKSPACE_ID } from "../lib/tasks/task-defaults";
import { projects, tasks, workspaces } from "../schema/schema";
import {
  parseBreakdownFromContent,
  type ProjectBreakdown,
} from "./breakdown.types";

type DrizzleDb = ReturnType<typeof getDrizzleDb>;

export type BriskAgentRuntime = {
  geminiApiKey: string;
  workspaceId: string;
  projectName?: string;
  projectDescription?: string;
};

export type BriskAgentDb = DrizzleDb & {
  briskConfig: BriskAgentRuntime;
};

const SYSTEM_PROMPT = `You are an Elite Multi-Industry Senior Project Manager.

Your job is to transform a user's unstructured onboarding goal into a practical delivery plan.

Analyze the goal and infer the domain (software, school group project, marketing campaign, research, operations, event planning, or similar).
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
    .filter((message) => message._getType() === "human")
    .map((message) =>
      typeof message.content === "string" ? message.content : "",
    )
    .join("\n")
    .trim();
}

export const BriskState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current, next) => {
      if (Array.isArray(next)) {
        return current.concat(next);
      }
      return current.concat([next]);
    },
    default: () => [],
  }),
  projectId: Annotation<string>,
  isStepValid: Annotation<boolean>,
});

export function createBriskAgent(db: BriskAgentDb) {
  const { briskConfig } = db;
  const workspaceId = briskConfig.workspaceId || DEFAULT_WORKSPACE_ID;

  const model = new ChatGoogleGenerativeAI({
    apiKey: briskConfig.geminiApiKey,
    model: "gemini-2.5-flash",
    temperature: 0.2,
  });

  async function verifyProjectNode(state: typeof BriskState.State) {
    if (!state.projectId.trim()) {
      return {
        isStepValid: false,
        messages: [
          new AIMessage("Verification failed: Active project context missing."),
        ],
      };
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, state.projectId))
      .limit(1);

    if (project) {
      return {
        isStepValid: true,
        messages: [new AIMessage("Project framework verified successfully.")],
      };
    }

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      return {
        isStepValid: false,
        messages: [
          new AIMessage("Verification failed: Target workspace context missing."),
        ],
      };
    }

    return {
      isStepValid: true,
      messages: [
        new AIMessage("Project context verified and ready for provisioning."),
      ],
    };
  }

  async function executePlanNode(state: typeof BriskState.State) {
    const userGoal = extractUserMessage(state.messages);

    if (!userGoal) {
      return {
        isStepValid: false,
        messages: [
          new AIMessage("Execution failed: No onboarding goal was provided."),
        ],
      };
    }

    const contextLines = [
      briskConfig.projectName
        ? `Project name: ${briskConfig.projectName}`
        : null,
      briskConfig.projectDescription
        ? `Project description: ${briskConfig.projectDescription}`
        : null,
      `User goal: ${userGoal}`,
    ].filter((line): line is string => line !== null);

    const response = await model.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(contextLines.join("\n")),
    ]);

    const content =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    const breakdown: ProjectBreakdown | null = parseBreakdownFromContent(content);

    if (!breakdown) {
      return {
        isStepValid: false,
        messages: [
          new AIMessage("Execution failed: Model response was not valid JSON."),
        ],
      };
    }

    const [existingProject] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, state.projectId))
      .limit(1);

    const projectTitle =
      breakdown.projectTitle?.trim() ||
      briskConfig.projectName?.trim() ||
      "New Project";

    if (!existingProject) {
      await db.insert(projects).values({
        id: state.projectId,
        workspaceId,
        name: projectTitle,
        description: briskConfig.projectDescription?.trim() || null,
      });
    }

    let tasksCreated = 0;

    for (const phase of breakdown.phases) {
      const phaseTaskId = `internal-${nanoid(10)}`;

      await db.insert(tasks).values({
        id: phaseTaskId,
        workspaceId,
        projectId: state.projectId,
        title: phase.name.trim(),
        description: phase.description?.trim() || null,
        status: "TODO",
        priority: "HIGH",
        source: "internal",
        tool: "Brisk AI",
      });

      tasksCreated += 1;

      for (const task of phase.tasks) {
        await db.insert(tasks).values({
          id: `internal-${nanoid(10)}`,
          workspaceId,
          projectId: state.projectId,
          parentId: phaseTaskId,
          title: task.title.trim(),
          description: task.description?.trim() || null,
          status: task.status ?? "BACKLOG",
          priority: task.priority ?? "MEDIUM",
          source: "internal",
          tool: "Brisk AI",
        });

        tasksCreated += 1;
      }
    }

    return {
      isStepValid: true,
      messages: [
        new AIMessage(
          `Generated ${breakdown.phases.length} phases with ${breakdown.phases.reduce(
            (count, phase) => count + phase.tasks.length,
            0,
          )} tasks.`,
        ),
        new AIMessage(
          `Persisted project "${projectTitle}" with ${breakdown.phases.length} milestones and ${tasksCreated} total records.`,
        ),
      ],
    };
  }

  function routeAfterVerify(state: typeof BriskState.State) {
    if (state.isStepValid) {
      return "executePlan";
    }
    return "end";
  }

  const workflow = new StateGraph(BriskState)
    .addNode("verifyProject", verifyProjectNode)
    .addNode("executePlan", executePlanNode)
    .addEdge(START, "verifyProject");

  workflow.addConditionalEdges("verifyProject", routeAfterVerify, {
    executePlan: "executePlan",
    end: END,
  });

  workflow.addEdge("executePlan", END);

  return workflow.compile();
}
