import type { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import type { ProjectBreakdown } from "./breakdown.types";

export type BriskErrorCode =
  | "INVALID_INPUT"
  | "WORKSPACE_NOT_FOUND"
  | "MODEL_FAILURE"
  | "INVALID_BREAKDOWN"
  | "DB_WRITE_FAILED";

export type NextWorker = "SUPERVISOR" | "ONBOARDING" | "METRICS" | "RISK" | "FINALIZE";

export type OnboardingPlan = {
  steps: string[];
  estimatedHours: number;
};

export type MetricsReport = {
  kpis: string[];
  targetMetrics: string;
};

export type RiskAnalysis = {
  threats: string[];
  mitigationStrategies: string[];
};

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
  retryCount: Annotation<number>({
    reducer: (_, next) => next,
    default: () => 0,
  }),
  errorCode: Annotation<BriskErrorCode | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  nextWorker: Annotation<NextWorker | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  onboardingPlan: Annotation<OnboardingPlan | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  metricsReport: Annotation<MetricsReport | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  riskAnalysis: Annotation<RiskAnalysis | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
});
