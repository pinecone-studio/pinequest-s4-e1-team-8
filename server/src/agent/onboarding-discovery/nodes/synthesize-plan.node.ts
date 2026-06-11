import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { DiscoveryState } from "../discovery.state";
import { tddPlanningBriefSchema } from "../discovery.types";
import { SYNTHESIZE_PLAN_SYSTEM_PROMPT, buildSynthesizePlanUserPrompt } from "../prompts";

/**
 * Produces the final TDD Planning Brief once `assessSufficiency` decides the
 * agent has gathered enough (or hit the hard round cap). Categories that
 * never reached "sufficient" are surfaced in `openQuestionsAndAssumptions`.
 */
export const createSynthesizePlanNode =
  (model: ChatGoogleGenerativeAI) => async (state: typeof DiscoveryState.State) => {
    const structuredModel = model.withStructuredOutput(tddPlanningBriefSchema);

    const brief = await structuredModel.invoke([
      new SystemMessage(SYNTHESIZE_PLAN_SYSTEM_PROMPT),
      new HumanMessage(
        buildSynthesizePlanUserPrompt({
          projectName: state.projectName,
          description: state.description,
          collectedInfo: state.collectedInfo,
          confidence: state.confidence,
          messages: state.messages,
        }),
      ),
    ]);

    return { brief };
  };
