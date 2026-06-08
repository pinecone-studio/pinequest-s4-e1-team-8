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
  features: string[];
  dashboardStrategy: string;
};

export type MetricsReport = {
  projectAnalytics: Record<string, number>;
  milestoneVelocity: number;
  progressEstimates: Record<string, number>;
};

export type RiskAnalysis = {
  timelineBottlenecks: string[];
  riskAssessments: string[];
  blockers: string[];
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
