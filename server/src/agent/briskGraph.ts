import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { END, START, StateGraph } from "@langchain/langgraph";
import type { getDrizzleDb } from "../lib/db/db";
import { BriskState } from "./brisk.state";
import type { BriskAgentRuntime } from "./brisk.types";
import { createGenerateBreakdownNode } from "./nodes/generate-breakdown.node";
import { createLogExecutionNode } from "./nodes/log-execution.node";
import { createPersistProjectNode } from "./nodes/persist-project.node";
import { createPersistTasksNode } from "./nodes/persist-tasks.node";
import { createValidateInputNode } from "./nodes/validate-input.node";
import { validateBreakdownNode } from "./nodes/validate-breakdown.node";
import { createVerifyProjectNode } from "./nodes/verify-project.node";
import { supervisorNode } from "./nodes/supervisor.node";
import { onboardingWorkerNode } from "./nodes/onboarding-worker.node";
import { metricsWorkerNode } from "./nodes/metrics-worker.node";
import { riskWorkerNode } from "./nodes/risk-worker.node";

export type { BriskAgentRuntime };
export { BriskState };

type DrizzleDb = ReturnType<typeof getDrizzleDb>;

export type BriskAgentDb = DrizzleDb & {
  briskConfig: BriskAgentRuntime;
};

const MAX_RETRIES = 3;

export function briskAgent(db: BriskAgentDb) {
  const { briskConfig } = db;

  const model = new ChatGoogleGenerativeAI({
    apiKey: briskConfig.geminiApiKey,
    model: "gemini-2.5-flash",
    temperature: 0.2,
  });

  const validateInputNode = createValidateInputNode(briskConfig);
  const verifyProjectNode = createVerifyProjectNode(db, briskConfig);
  const generateBreakdownNode = createGenerateBreakdownNode(model, briskConfig);
  const persistProjectNode = createPersistProjectNode(db, briskConfig);
  const persistTasksNode = createPersistTasksNode(db, briskConfig);
  const logExecutionNode = createLogExecutionNode(db, briskConfig);

  function routeAfterValidateInput(state: typeof BriskState.State) {
    return state.isStepValid ? "verifyProject" : "end";
  }

  function routeAfterVerify(state: typeof BriskState.State) {
    if (state.errorCode === "WORKSPACE_NOT_FOUND") return "end";
    return state.isStepValid ? "generateBreakdown" : "end";
  }

  function routeAfterGenerate(state: typeof BriskState.State) {
    if (state.errorCode === "MODEL_FAILURE") {
      return state.retryCount < MAX_RETRIES ? "retryGenerate" : "end";
    }
    return state.isStepValid ? "validateBreakdown" : "end";
  }

  function routeAfterValidateBreakdown(state: typeof BriskState.State) {
    if (state.errorCode === "INVALID_BREAKDOWN") {
      return state.retryCount < MAX_RETRIES ? "retryGenerate" : "end";
    }
    return state.isStepValid ? "persistProject" : "end";
  }

  function routeAfterPersistProject(state: typeof BriskState.State) {
    if (state.errorCode === "DB_WRITE_FAILED") return "end";
    return state.isStepValid ? "persistTasks" : "end";
  }

  function routeAfterSupervisor(state: typeof BriskState.State) {
    switch (state.nextWorker) {
      case "ONBOARDING":
        return "onboardingWorker";
      case "METRICS":
        return "metricsWorker";
      case "RISK":
        return "riskWorker";
      default:
        return "end";
    }
  }

  const workflow = new StateGraph(BriskState)
    .addNode("validateInput", validateInputNode)
    .addNode("verifyProject", verifyProjectNode)
    .addNode("generateBreakdown", generateBreakdownNode)
    .addNode("validateBreakdown", validateBreakdownNode)
    .addNode("persistProject", persistProjectNode)
    .addNode("persistTasks", persistTasksNode)
    .addNode("logExecution", logExecutionNode)
    .addNode("supervisor", supervisorNode)
    .addNode("onboardingWorker", onboardingWorkerNode)
    .addNode("metricsWorker", metricsWorkerNode)
    .addNode("riskWorker", riskWorkerNode)
    .addEdge(START, "validateInput");

  workflow.addConditionalEdges("validateInput", routeAfterValidateInput, {
    verifyProject: "verifyProject",
    end: END,
  });

  workflow.addConditionalEdges("verifyProject", routeAfterVerify, {
    generateBreakdown: "generateBreakdown",
    end: END,
  });

  workflow.addConditionalEdges("generateBreakdown", routeAfterGenerate, {
    validateBreakdown: "validateBreakdown",
    retryGenerate: "generateBreakdown",
    end: END,
  });

  workflow.addConditionalEdges("validateBreakdown", routeAfterValidateBreakdown, {
    persistProject: "persistProject",
    retryGenerate: "generateBreakdown",
    end: END,
  });

  workflow.addConditionalEdges("persistProject", routeAfterPersistProject, {
    persistTasks: "persistTasks",
    end: END,
  });

  workflow.addConditionalEdges("supervisor", routeAfterSupervisor, {
    onboardingWorker: "onboardingWorker",
    metricsWorker: "metricsWorker",
    riskWorker: "riskWorker",
    end: END,
  });

  workflow.addEdge("onboardingWorker", "supervisor");
  workflow.addEdge("metricsWorker", "supervisor");
  workflow.addEdge("riskWorker", "supervisor");

  workflow.addEdge("persistTasks", "logExecution");
  workflow.addEdge("logExecution", "supervisor");

  return workflow.compile();
}
