import {
  HIGH_IMPACT_CATEGORIES,
  RUBRIC_CATEGORIES,
  type ConfidenceLevel,
  type ConfidenceMap,
  type DiscoveryQuestion,
  type SufficiencyDecision,
} from "./discovery.types";

/** Soft target: a typical project should converge in this many rounds. */
export const SOFT_ROUND_TARGET_MIN = 2;
export const SOFT_ROUND_TARGET_MAX = 4;

/** Hard safety cap: synthesize regardless of coverage once this many rounds have run. */
export const HARD_ROUND_CAP = 5;

export type SufficiencyAssessment = {
  decision: SufficiencyDecision;
  reasoning: string;
};

/**
 * Pure routing logic for the assess-sufficiency node. Stops questioning once
 * every category has at least "partial" confidence and every high-impact
 * category has reached "sufficient" — or once the hard round cap is hit.
 */
export function assessSufficiency(confidence: ConfidenceMap, round: number): SufficiencyAssessment {
  if (round >= HARD_ROUND_CAP) {
    return {
      decision: "synthesize",
      reasoning: `Hard cap of ${HARD_ROUND_CAP} rounds reached; synthesizing with the information gathered so far and flagging remaining gaps as assumptions.`,
    };
  }

  const belowPartial = RUBRIC_CATEGORIES.filter((category) => confidence[category] === "unknown");
  const highImpactNotSufficient = HIGH_IMPACT_CATEGORIES.filter(
    (category) => confidence[category] !== "sufficient",
  );

  if (belowPartial.length === 0 && highImpactNotSufficient.length === 0) {
    return {
      decision: "synthesize",
      reasoning:
        "Every category has at least partial coverage and all high-impact categories (vision, users, core features, platform, data) are sufficient.",
    };
  }

  const highImpactSet = new Set<string>(highImpactNotSufficient);
  const gaps = [
    ...highImpactNotSufficient.map((category) => `${category} (high-impact, needs to reach sufficient)`),
    ...belowPartial
      .filter((category) => !highImpactSet.has(category))
      .map((category) => `${category} (needs at least partial)`),
  ];

  return {
    decision: "ask_more",
    reasoning: `Still need more detail on: ${gaps.join(", ")}.`,
  };
}

const CONFIDENCE_SCORE: Record<ConfidenceLevel, number> = {
  unknown: 0,
  partial: 0.5,
  sufficient: 1,
};

/** Overall information-coverage percentage (0-100), used for UI progress bars. */
export function computeCoveragePercent(confidence: ConfidenceMap): number {
  const total = RUBRIC_CATEGORIES.reduce((sum, category) => sum + CONFIDENCE_SCORE[confidence[category]], 0);
  return Math.round((total / RUBRIC_CATEGORIES.length) * 100);
}

/**
 * Drops any generated question whose topic was already asked in a prior
 * round. If filtering would remove every question (e.g. the model ignored
 * the no-repeat instruction entirely), the original list is returned so a
 * round is never left empty.
 */
export function filterRepeatedQuestions(
  questions: DiscoveryQuestion[],
  askedTopics: string[],
): DiscoveryQuestion[] {
  const askedSet = new Set(askedTopics.map((topic) => topic.trim().toLowerCase()));
  const filtered = questions.filter((question) => !askedSet.has(question.topic.trim().toLowerCase()));
  return filtered.length > 0 ? filtered : questions;
}
