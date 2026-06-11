import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { DiscoveryState } from "../discovery.state";
import { generateQuestionsResultSchema } from "../discovery.types";
import { GENERATE_QUESTIONS_SYSTEM_PROMPT, buildGenerateQuestionsUserPrompt } from "../prompts";
import { filterRepeatedQuestions } from "../rubric";

/**
 * Produces this round's 2-4 grouped questions, filters out any that repeat
 * an already-asked topic (safety net on top of the prompt instruction), and
 * advances the round counter.
 */
export const createGenerateQuestionsNode =
  (model: ChatGoogleGenerativeAI) => async (state: typeof DiscoveryState.State) => {
    const structuredModel = model.withStructuredOutput(generateQuestionsResultSchema);

    const result = await structuredModel.invoke([
      new SystemMessage(GENERATE_QUESTIONS_SYSTEM_PROMPT),
      new HumanMessage(
        buildGenerateQuestionsUserPrompt({
          projectName: state.projectName,
          description: state.description,
          collectedInfo: state.collectedInfo,
          confidence: state.confidence,
          askedTopics: state.askedTopics,
          round: state.round,
          sufficiencyReasoning: state.sufficiencyReasoning,
        }),
      ),
    ]);

    const questions = filterRepeatedQuestions(result.questions, state.askedTopics);

    return {
      pendingQuestions: questions,
      askedTopics: [...state.askedTopics, ...questions.map((question) => question.topic)],
      round: state.round + 1,
    };
  };
