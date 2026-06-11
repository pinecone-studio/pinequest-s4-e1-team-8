import type {
  ContextualSuggestion,
  DiscoveryQuestion,
  OnboardingTranscriptMessage,
} from "@/lib/onboarding/tdd-types";

export type DiscoveryWorkspacePhase = "interview" | "canvas";

export const HARD_ROUND_CAP = 5;

export type DiscoverySessionState = {
  round: number;
  coverage: number;
  messages: OnboardingTranscriptMessage[];
  activeQuestions: DiscoveryQuestion[];
  inputValue: string;
  isLoading: boolean;
  streamingContent: string;
};

export type DiscoveryStatusMetrics = {
  stepIndex: number;
  round: number;
  coverage: number;
};

export const PHASE_1_ARCHETYPE_BOOSTERS: ContextualSuggestion[] = [
  {
    display_label: "Personal side project",
    text_to_inject:
      "I want a simple personal app where one person tracks their daily habits, sees progress over time, and gets gentle reminders to stay on track.",
  },
  {
    display_label: "Team business platform",
    text_to_inject:
      "I want a shared workspace where managers oversee multiple teams, each team keeps its own records private, and members collaborate on shared goals.",
  },
];

export function flattenQuestionExamples(questions: DiscoveryQuestion[]): ContextualSuggestion[] {
  return questions.flatMap((question) =>
    (question.examples ?? []).map((example) => ({
      display_label: example,
      text_to_inject: example,
    })),
  );
}

export function resolveVisibleSuggestions(
  round: number,
  messages: OnboardingTranscriptMessage[],
  activeSuggestions: ContextualSuggestion[],
): ContextualSuggestion[] {
  if (activeSuggestions.length > 0) {
    return activeSuggestions;
  }
  const hasUserMessages = messages.some((message) => message.role === "user");
  if (round <= 1 && !hasUserMessages) {
    return PHASE_1_ARCHETYPE_BOOSTERS;
  }
  return [];
}

export function computeDiscoveryMetrics(round: number, coverage: number): DiscoveryStatusMetrics {
  return {
    stepIndex: 1,
    round,
    coverage,
  };
}
