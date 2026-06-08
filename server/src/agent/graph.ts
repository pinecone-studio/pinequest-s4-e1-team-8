import { END, START, StateGraph } from "@langchain/langgraph";
import { metricsWorkerNode } from "./nodes/metrics";
import { onboardingWorkerNode } from "./nodes/onboarding";
import { prGeneratorWorkerNode } from "./nodes/prGenerator";
import { riskWorkerNode } from "./nodes/risk";
import type { SupervisorContext } from "./state";
import { SupervisorGraphState } from "./state";

export const SUPERVISOR_NODE = "supervisor";
export const ONBOARDING_WORKER_NODE = "onboarding_worker";
export const METRICS_WORKER_NODE = "metrics_worker";
export const RISK_WORKER_NODE = "risk_worker";
export const PR_GENERATOR_WORKER_NODE = "pr_generator_worker";
export const FINALIZE_ROUTE = "FINALIZE";

async function supervisorNode(_state: typeof SupervisorGraphState.State) {
  return {};
}

function allMilestonesComplete(context: SupervisorContext): boolean {
  return (
    context.onboardingComplete &&
    context.metricsAnalyzed &&
    context.risksIdentified &&
    context.prGenerated
  );
}

function isFinalizeSignal(nextElement: string): boolean {
  return nextElement === FINALIZE_ROUTE || nextElement === "END" || nextElement === "__end__";
}

function isUserRequestFullyAnswered(state: typeof SupervisorGraphState.State): boolean {
  if (isFinalizeSignal(state.nextElement)) {
    return true;
  }
  const lastMessage = state.messages[state.messages.length - 1];
  return lastMessage?._getType() === "ai" && allMilestonesComplete(state.context);
}

function routeFromSupervisor(state: typeof SupervisorGraphState.State) {
  if (isUserRequestFullyAnswered(state) || allMilestonesComplete(state.context)) {
    return FINALIZE_ROUTE;
  }

  switch (state.nextElement) {
    case ONBOARDING_WORKER_NODE:
      return ONBOARDING_WORKER_NODE;
    case METRICS_WORKER_NODE:
      return METRICS_WORKER_NODE;
    case RISK_WORKER_NODE:
      return RISK_WORKER_NODE;
    case PR_GENERATOR_WORKER_NODE:
      return PR_GENERATOR_WORKER_NODE;
    default:
      if (!state.context.onboardingComplete) {
        return ONBOARDING_WORKER_NODE;
      }
      if (!state.context.metricsAnalyzed) {
        return METRICS_WORKER_NODE;
      }
      if (!state.context.risksIdentified) {
        return RISK_WORKER_NODE;
      }
      if (!state.context.prGenerated) {
        return PR_GENERATOR_WORKER_NODE;
      }
      return FINALIZE_ROUTE;
  }
}

export function buildSupervisorGraph() {
  const workflow = new StateGraph(SupervisorGraphState)
    .addNode(SUPERVISOR_NODE, supervisorNode)
    .addNode(ONBOARDING_WORKER_NODE, onboardingWorkerNode)
    .addNode(METRICS_WORKER_NODE, metricsWorkerNode)
    .addNode(RISK_WORKER_NODE, riskWorkerNode)
    .addNode(PR_GENERATOR_WORKER_NODE, prGeneratorWorkerNode)
    .addEdge(START, SUPERVISOR_NODE);

  workflow.addConditionalEdges(SUPERVISOR_NODE, routeFromSupervisor, {
    [ONBOARDING_WORKER_NODE]: ONBOARDING_WORKER_NODE,
    [METRICS_WORKER_NODE]: METRICS_WORKER_NODE,
    [RISK_WORKER_NODE]: RISK_WORKER_NODE,
    [PR_GENERATOR_WORKER_NODE]: PR_GENERATOR_WORKER_NODE,
    [FINALIZE_ROUTE]: END,
  });

  workflow.addEdge(ONBOARDING_WORKER_NODE, SUPERVISOR_NODE);
  workflow.addEdge(METRICS_WORKER_NODE, SUPERVISOR_NODE);
  workflow.addEdge(RISK_WORKER_NODE, SUPERVISOR_NODE);
  workflow.addEdge(PR_GENERATOR_WORKER_NODE, SUPERVISOR_NODE);

  return workflow;
}

export function compileSupervisorGraph() {
  return buildSupervisorGraph().compile();
}
