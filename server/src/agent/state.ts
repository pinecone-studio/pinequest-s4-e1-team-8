import type { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";

export type SupervisorContext = {
  onboardingComplete: boolean;
  metricsAnalyzed: boolean;
  risksIdentified: boolean;
  prGenerated: boolean;
};

export const SupervisorGraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current, next) => {
      if (Array.isArray(next)) return current.concat(next);
      return current.concat([next]);
    },
    default: () => [],
  }),
  nextElement: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "supervisor",
  }),
  context: Annotation<SupervisorContext>({
    reducer: (current, next) => ({ ...current, ...next }),
    default: () => ({
      onboardingComplete: false,
      metricsAnalyzed: false,
      risksIdentified: false,
      prGenerated: false,
    }),
  }),
});
