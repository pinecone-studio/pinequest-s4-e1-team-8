import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { END, START, StateGraph } from "@langchain/langgraph";
import { DiscoveryState } from "./discovery.state";
import { createAnalyzeResponsesNode } from "./nodes/analyze-responses.node";
import { assessSufficiencyNode } from "./nodes/assess-sufficiency.node";
import { createGenerateQuestionsNode } from "./nodes/generate-questions.node";
import { createSynthesizePlanNode } from "./nodes/synthesize-plan.node";

export { DiscoveryState };

const DISCOVERY_MODEL_NAME = "gemini-2.5-flash";

export function createDiscoveryModel(apiKey: string): ChatGoogleGenerativeAI {
  return new ChatGoogleGenerativeAI({
    apiKey,
    model: DISCOVERY_MODEL_NAME,
    temperature: 0.3,
  });
}

/**
 * Builds the self-managing discovery graph:
 *
 *   START -> analyzeResponses -> assessSufficiency -+-(ask_more)----> generateQuestions -> END
 *                                                    +-(synthesize)--> synthesizePlan   -> END
 *
 * Each compiled-graph `.invoke(...)` is one full pass through this topology
 * — i.e. one chat turn. There is no `interrupt()`/checkpointer: the caller
 * persists the relevant parts of the resulting state (collectedInfo,
 * confidence, round, askedTopics, brief) and rehydrates them on the next
 * turn. See README.md for the full rationale.
 */
export function createDiscoveryGraph(model: ChatGoogleGenerativeAI) {
  const analyzeResponsesNode = createAnalyzeResponsesNode(model);
  const generateQuestionsNode = createGenerateQuestionsNode(model);
  const synthesizePlanNode = createSynthesizePlanNode(model);

  function routeAfterSufficiency(state: typeof DiscoveryState.State) {
    return state.sufficiencyDecision === "synthesize" ? "synthesizePlan" : "generateQuestions";
  }

  const workflow = new StateGraph(DiscoveryState)
    .addNode("analyzeResponses", analyzeResponsesNode)
    .addNode("assessSufficiency", assessSufficiencyNode)
    .addNode("generateQuestions", generateQuestionsNode)
    .addNode("synthesizePlan", synthesizePlanNode)
    .addEdge(START, "analyzeResponses")
    .addEdge("analyzeResponses", "assessSufficiency");

  workflow.addConditionalEdges("assessSufficiency", routeAfterSufficiency, {
    generateQuestions: "generateQuestions",
    synthesizePlan: "synthesizePlan",
  });

  workflow.addEdge("generateQuestions", END);
  workflow.addEdge("synthesizePlan", END);

  return workflow.compile();
}

export type DiscoveryGraph = ReturnType<typeof createDiscoveryGraph>;
