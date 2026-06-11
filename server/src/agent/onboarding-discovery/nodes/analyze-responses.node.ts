import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { DiscoveryState } from "../discovery.state";
import { analyzeResultSchema } from "../discovery.types";
import { ANALYZE_SYSTEM_PROMPT, buildAnalyzeUserPrompt } from "../prompts";

/**
 * Re-derives `collectedInfo` and `confidence` for all 8 rubric categories
 * from the full conversation so far. Runs at the start of every turn,
 * including the very first one (where `messages` may still be empty and
 * only `projectName`/`description` are available).
 */
export const createAnalyzeResponsesNode =
  (model: ChatGoogleGenerativeAI) => async (state: typeof DiscoveryState.State) => {
    const structuredModel = model.withStructuredOutput(analyzeResultSchema);

    const result = await structuredModel.invoke([
      new SystemMessage(ANALYZE_SYSTEM_PROMPT),
      new HumanMessage(
        buildAnalyzeUserPrompt({
          projectName: state.projectName,
          description: state.description,
          messages: state.messages,
          collectedInfo: state.collectedInfo,
          confidence: state.confidence,
        }),
      ),
    ]);

    return {
      collectedInfo: result.collectedInfo,
      confidence: result.confidence,
    };
  };
