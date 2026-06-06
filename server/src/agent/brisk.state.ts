import type { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import type { ProjectBreakdown } from "./breakdown.types";

export const BriskState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current, next) => {
      if (Array.isArray(next)) return current.concat(next);
      return current.concat([next]);
    },
    default: () => [],
  }),
  projectId: Annotation<string>,
  isStepValid: Annotation<boolean>,
  breakdown: Annotation<ProjectBreakdown | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
});
