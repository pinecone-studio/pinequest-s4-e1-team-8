import { END, START, StateGraph } from "@langchain/langgraph";
import { SupervisorGraphState } from "./state";

export const SUPERVISOR_NODE = "supervisor";
export const ONBOARDING_WORKER_NODE = "onboarding_worker";
export const METRICS_WORKER_NODE = "metrics_worker";
export const RISK_WORKER_NODE = "risk_worker";

async function supervisorNode(_state: typeof SupervisorGraphState.State) {
  return {};
}

async function onboardingWorkerNode(_state: typeof SupervisorGraphState.State) {
  return {};
}

async function metricsWorkerNode(_state: typeof SupervisorGraphState.State) {
  return {};
}

async function riskWorkerNode(_state: typeof SupervisorGraphState.State) {
  return {};
}

function routeFromSupervisor(state: typeof SupervisorGraphState.State) {
  switch (state.nextElement) {
    case ONBOARDING_WORKER_NODE:
      return ONBOARDING_WORKER_NODE;
    case METRICS_WORKER_NODE:
      return METRICS_WORKER_NODE;
    case RISK_WORKER_NODE:
      return RISK_WORKER_NODE;
    default:
      return "end";
  }
}

export function buildSupervisorGraph() {
  const workflow = new StateGraph(SupervisorGraphState)
    .addNode(SUPERVISOR_NODE, supervisorNode)
    .addNode(ONBOARDING_WORKER_NODE, onboardingWorkerNode)
    .addNode(METRICS_WORKER_NODE, metricsWorkerNode)
    .addNode(RISK_WORKER_NODE, riskWorkerNode)
    .addEdge(START, SUPERVISOR_NODE);

  workflow.addConditionalEdges(SUPERVISOR_NODE, routeFromSupervisor, {
    [ONBOARDING_WORKER_NODE]: ONBOARDING_WORKER_NODE,
    [METRICS_WORKER_NODE]: METRICS_WORKER_NODE,
    [RISK_WORKER_NODE]: RISK_WORKER_NODE,
    end: END,
  });

  workflow.addEdge(ONBOARDING_WORKER_NODE, SUPERVISOR_NODE);
  workflow.addEdge(METRICS_WORKER_NODE, SUPERVISOR_NODE);
  workflow.addEdge(RISK_WORKER_NODE, SUPERVISOR_NODE);

  return workflow;
}

export function compileSupervisorGraph() {
  return buildSupervisorGraph().compile();
}
