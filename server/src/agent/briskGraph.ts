import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { getDrizzleDb } from "../lib/db/db";
import { projects, tasks } from "../schema/schema";

type DB = ReturnType<typeof getDrizzleDb>;

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

export function createBriskAgent(db: DB) {
  async function verifyProjectNode(state: typeof BriskState.State) {
    const projectExists = await db
      .select()
      .from(projects)
      .where(eq(projects.id, state.projectId))
      .limit(1);

    if (projectExists.length === 0) {
      return {
        isStepValid: false,
        messages: [
          new AIMessage("Verification failed: Target project context missing."),
        ],
      };
    }

    return {
      isStepValid: true,
      messages: [
        new AIMessage("Project framework verified successfully."),
      ],
    };
  }

  async function logExecutionNode(state: typeof BriskState.State) {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, state.projectId))
      .limit(1);

    if (project) {
      await db.insert(tasks).values({
        id: `internal-${nanoid(10)}`,
        workspaceId: project.workspaceId,
        projectId: state.projectId,
        title: "Graph execution completed successfully.",
      });
    }

    return {
      messages: [new AIMessage("Execution task logged safely.")],
    };
  }

  function routeDecision(state: typeof BriskState.State) {
    if (state.isStepValid) {
      return "logExecution";
    }
    return "end";
  }

  const workflow = new StateGraph(BriskState)
    .addNode("verifyProject", verifyProjectNode)
    .addNode("logExecution", logExecutionNode)
    .addEdge(START, "verifyProject");

  workflow.addConditionalEdges("verifyProject", routeDecision, {
    logExecution: "logExecution",
    end: END,
  });

  workflow.addEdge("logExecution", END);

  return workflow.compile();
}
