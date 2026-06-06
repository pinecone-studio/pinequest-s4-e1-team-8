import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { END, START, StateGraph } from "@langchain/langgraph";
import type { getDrizzleDb } from "../lib/db/db";
import { BriskState } from "./brisk.state";
import type { BriskAgentRuntime } from "./brisk.types";
import { createGenerateBreakdownNode } from "./nodes/generate-breakdown.node";
import { createLogExecutionNode } from "./nodes/log-execution.node";
import { createPersistProjectNode } from "./nodes/persist-project.node";
import { createPersistTasksNode } from "./nodes/persist-tasks.node";
import { createVerifyProjectNode } from "./nodes/verify-project.node";

export type { BriskAgentRuntime };
export { BriskState };

type DrizzleDb = ReturnType<typeof getDrizzleDb>;

export type BriskAgentDb = DrizzleDb & {
  briskConfig: BriskAgentRuntime;
};

export function createBriskAgent(db: BriskAgentDb) {
  const { briskConfig } = db;

  const model = new ChatGoogleGenerativeAI({
    apiKey: briskConfig.geminiApiKey,
    model: "gemini-2.5-flash",
    temperature: 0.2,
  });

  const verifyProjectNode = createVerifyProjectNode(db, briskConfig);
  const generateBreakdownNode = createGenerateBreakdownNode(model, briskConfig);
  const persistProjectNode = createPersistProjectNode(db, briskConfig);
  const persistTasksNode = createPersistTasksNode(db, briskConfig);
  const logExecutionNode = createLogExecutionNode(db, briskConfig);

  function routeAfterVerify(state: typeof BriskState.State) {
    return state.isStepValid ? "generateBreakdown" : "end";
  }

  function routeAfterGenerate(state: typeof BriskState.State) {
    return state.isStepValid ? "persistProject" : "end";
  }

  function routeAfterPersistProject(state: typeof BriskState.State) {
    return state.isStepValid ? "persistTasks" : "end";
  }

  const workflow = new StateGraph(BriskState)
    .addNode("verifyProject", verifyProjectNode)
    .addNode("generateBreakdown", generateBreakdownNode)
    .addNode("persistProject", persistProjectNode)
    .addNode("persistTasks", persistTasksNode)
    .addNode("logExecution", logExecutionNode)
    .addEdge(START, "verifyProject");

  workflow.addConditionalEdges("verifyProject", routeAfterVerify, {
    generateBreakdown: "generateBreakdown",
    end: END,
  });

  workflow.addConditionalEdges("generateBreakdown", routeAfterGenerate, {
    persistProject: "persistProject",
    end: END,
  });

  workflow.addConditionalEdges("persistProject", routeAfterPersistProject, {
    persistTasks: "persistTasks",
    end: END,
  });

  workflow.addEdge("persistTasks", "logExecution");
  workflow.addEdge("logExecution", END);

  return workflow.compile();
}
