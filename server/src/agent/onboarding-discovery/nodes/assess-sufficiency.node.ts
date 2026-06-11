import type { DiscoveryState } from "../discovery.state";
import { assessSufficiency } from "../rubric";

/**
 * Pure routing node: scores the rubric (via `assessSufficiency`) and
 * records the decision + reasoning into state for the conditional edge
 * (and for observability/debugging).
 */
export function assessSufficiencyNode(state: typeof DiscoveryState.State) {
  const { decision, reasoning } = assessSufficiency(state.confidence, state.round);

  return {
    sufficiencyDecision: decision,
    sufficiencyReasoning: reasoning,
  };
}
