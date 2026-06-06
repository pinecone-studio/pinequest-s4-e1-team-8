import { AIMessage } from "@langchain/core/messages";
import type { BriskState } from "../brisk.state";
import type { BriskAgentRuntime } from "../brisk.types";

export const createValidateInputNode =
  (config: BriskAgentRuntime) =>
  async (state: typeof BriskState.State) => {
    if (!state.projectId?.trim()) {
      return {
        isStepValid: false,
        errorCode: "INVALID_INPUT" as const,
        messages: [new AIMessage("Validation failed: projectId is required.")],
      };
    }

    if (!state.messages.some((m) => m._getType() === "human")) {
      return {
        isStepValid: false,
        errorCode: "INVALID_INPUT" as const,
        messages: [new AIMessage("Validation failed: At least one user message is required.")],
      };
    }

    if (!config.workspaceId?.trim()) {
      return {
        isStepValid: false,
        errorCode: "INVALID_INPUT" as const,
        messages: [new AIMessage("Validation failed: workspaceId configuration is missing.")],
      };
    }

    return {
      isStepValid: true,
      errorCode: null,
    };
  };
