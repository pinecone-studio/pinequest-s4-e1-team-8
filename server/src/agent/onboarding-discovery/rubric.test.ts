import { describe, expect, test } from "bun:test";
import {
  HIGH_IMPACT_CATEGORIES,
  RUBRIC_CATEGORIES,
  createDefaultConfidence,
  type ConfidenceLevel,
  type ConfidenceMap,
  type DiscoveryQuestion,
} from "./discovery.types";
import { HARD_ROUND_CAP, assessSufficiency, computeCoveragePercent, filterRepeatedQuestions } from "./rubric";

function confidenceWith(level: ConfidenceLevel): ConfidenceMap {
  return Object.fromEntries(RUBRIC_CATEGORIES.map((category) => [category, level])) as ConfidenceMap;
}

describe("assessSufficiency", () => {
  test("asks for more when every category is unknown", () => {
    const result = assessSufficiency(createDefaultConfidence(), 0);

    expect(result.decision).toBe("ask_more");
    expect(result.reasoning).toContain("product_vision");
  });

  test("synthesizes once every category is at least partial and high-impact ones are sufficient", () => {
    const confidence = confidenceWith("partial");
    for (const category of HIGH_IMPACT_CATEGORIES) {
      confidence[category] = "sufficient";
    }

    const result = assessSufficiency(confidence, 1);

    expect(result.decision).toBe("synthesize");
  });

  test("keeps asking if a high-impact category is only partial", () => {
    const confidence = confidenceWith("sufficient");
    confidence[HIGH_IMPACT_CATEGORIES[0]] = "partial";

    const result = assessSufficiency(confidence, 1);

    expect(result.decision).toBe("ask_more");
    expect(result.reasoning).toContain(HIGH_IMPACT_CATEGORIES[0]);
  });

  test("hits the hard cap regardless of confidence", () => {
    const result = assessSufficiency(createDefaultConfidence(), HARD_ROUND_CAP);

    expect(result.decision).toBe("synthesize");
    expect(result.reasoning).toContain("Hard cap");
  });

  test("does not apply the hard cap one round earlier", () => {
    const result = assessSufficiency(createDefaultConfidence(), HARD_ROUND_CAP - 1);

    expect(result.decision).toBe("ask_more");
  });
});

describe("computeCoveragePercent", () => {
  test("is 0 when nothing is known", () => {
    expect(computeCoveragePercent(createDefaultConfidence())).toBe(0);
  });

  test("is 50 when everything is partial", () => {
    expect(computeCoveragePercent(confidenceWith("partial"))).toBe(50);
  });

  test("is 100 when everything is sufficient", () => {
    expect(computeCoveragePercent(confidenceWith("sufficient"))).toBe(100);
  });
});

describe("filterRepeatedQuestions", () => {
  const questionAbout = (topic: string): DiscoveryQuestion => ({
    id: topic,
    category: "product_vision",
    topic,
    prompt: `Tell us about ${topic}`,
  });

  test("drops questions whose topic was already asked, ignoring case and whitespace", () => {
    const questions = [questionAbout("Pricing model"), questionAbout("Onboarding flow")];

    const result = filterRepeatedQuestions(questions, ["  pricing model  "]);

    expect(result).toHaveLength(1);
    expect(result[0].topic).toBe("Onboarding flow");
  });

  test("keeps every question when none were asked before", () => {
    const questions = [questionAbout("Pricing model"), questionAbout("Onboarding flow")];

    expect(filterRepeatedQuestions(questions, [])).toEqual(questions);
  });

  test("falls back to the original list rather than returning an empty round", () => {
    const questions = [questionAbout("Pricing model")];

    expect(filterRepeatedQuestions(questions, ["pricing model"])).toEqual(questions);
  });
});
