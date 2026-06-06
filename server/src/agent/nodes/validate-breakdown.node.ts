import { AIMessage } from "@langchain/core/messages";
import type { BriskState } from "../brisk.state";

const MIN_PHASES = 3;
const MIN_TASKS_PER_PHASE = 2;

export const validateBreakdownNode = async (state: typeof BriskState.State) => {
  if (!state.breakdown) {
    return {
      isStepValid: false,
      errorCode: "INVALID_BREAKDOWN" as const,
      retryCount: state.retryCount + 1,
      messages: [new AIMessage("Validation failed: No breakdown present in state.")],
    };
  }

  if (state.breakdown.phases.length < MIN_PHASES) {
    return {
      isStepValid: false,
      errorCode: "INVALID_BREAKDOWN" as const,
      retryCount: state.retryCount + 1,
      messages: [
        new AIMessage(
          `Validation failed: Breakdown has ${state.breakdown.phases.length} phase(s) but requires at least ${MIN_PHASES}.`,
        ),
      ],
    };
  }

  const underfilledPhase = state.breakdown.phases.find(
    (p) => p.tasks.length < MIN_TASKS_PER_PHASE,
  );

  if (underfilledPhase) {
    return {
      isStepValid: false,
      errorCode: "INVALID_BREAKDOWN" as const,
      retryCount: state.retryCount + 1,
      messages: [
        new AIMessage(
          `Validation failed: Phase "${underfilledPhase.name}" contains fewer than ${MIN_TASKS_PER_PHASE} tasks.`,
        ),
      ],
    };
  }

  return {
    isStepValid: true,
    errorCode: null,
    messages: [new AIMessage("Breakdown structure validated successfully.")],
  };
};
