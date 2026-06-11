import { Annotation } from "@langchain/langgraph";
import type { OnboardingTranscriptMessage } from "../../lib/onboarding/tdd-types";
import {
  createDefaultCollectedInfo,
  createDefaultConfidence,
  type CollectedInfo,
  type ConfidenceMap,
  type DiscoveryQuestion,
  type SufficiencyDecision,
  type TddPlanningBrief,
} from "./discovery.types";

export const DiscoveryState = Annotation.Root({
  projectName: Annotation<string>,
  description: Annotation<string>,
  messages: Annotation<OnboardingTranscriptMessage[]>({
    reducer: (_current, next) => next,
    default: () => [],
  }),
  collectedInfo: Annotation<CollectedInfo>({
    reducer: (_current, next) => next,
    default: () => createDefaultCollectedInfo(),
  }),
  confidence: Annotation<ConfidenceMap>({
    reducer: (_current, next) => next,
    default: () => createDefaultConfidence(),
  }),
  round: Annotation<number>({
    reducer: (_current, next) => next,
    default: () => 0,
  }),
  askedTopics: Annotation<string[]>({
    reducer: (_current, next) => next,
    default: () => [],
  }),
  pendingQuestions: Annotation<DiscoveryQuestion[]>({
    reducer: (_current, next) => next,
    default: () => [],
  }),
  sufficiencyDecision: Annotation<SufficiencyDecision | null>({
    reducer: (_current, next) => next,
    default: () => null,
  }),
  sufficiencyReasoning: Annotation<string>({
    reducer: (_current, next) => next,
    default: () => "",
  }),
  brief: Annotation<TddPlanningBrief | null>({
    reducer: (_current, next) => next,
    default: () => null,
  }),
});
