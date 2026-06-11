import { describe, expect, test } from "bun:test";
import {
  RUBRIC_CATEGORIES,
  createDefaultCollectedInfo,
  createDefaultConfidence,
  createDefaultDiscoveryState,
  parseDiscoveryState,
  parsePlanningBrief,
  serializeDiscoveryState,
  serializePlanningBrief,
  tddPlanningBriefSchema,
  type PersistedDiscoveryState,
  type TddPlanningBrief,
} from "./discovery.types";

describe("createDefaultDiscoveryState", () => {
  test("starts every category as unknown / empty with round 0", () => {
    const defaults = createDefaultDiscoveryState();

    expect(defaults.round).toBe(0);
    expect(defaults.askedTopics).toEqual([]);
    for (const category of RUBRIC_CATEGORIES) {
      expect(defaults.collectedInfo[category]).toBe("");
      expect(defaults.confidence[category]).toBe("unknown");
    }
  });
});

describe("parseDiscoveryState", () => {
  test("returns defaults for missing input", () => {
    expect(parseDiscoveryState(null)).toEqual(createDefaultDiscoveryState());
    expect(parseDiscoveryState(undefined)).toEqual(createDefaultDiscoveryState());
    expect(parseDiscoveryState("")).toEqual(createDefaultDiscoveryState());
  });

  test("returns defaults for invalid JSON", () => {
    expect(parseDiscoveryState("{not json")).toEqual(createDefaultDiscoveryState());
  });

  test("round-trips through serializeDiscoveryState", () => {
    const state: PersistedDiscoveryState = {
      collectedInfo: { ...createDefaultCollectedInfo(), product_vision: "A laundry marketplace" },
      confidence: { ...createDefaultConfidence(), product_vision: "sufficient" },
      round: 2,
      askedTopics: ["pricing model", "target users"],
      sufficiencyReasoning: "Still need more detail on integrations.",
    };

    expect(parseDiscoveryState(serializeDiscoveryState(state))).toEqual(state);
  });

  test("falls back per-field for unknown categories, bad confidence values, and bad types", () => {
    const raw = JSON.stringify({
      collectedInfo: { product_vision: "An app", made_up_category: "ignored" },
      confidence: { product_vision: "sufficient", target_users: "not-a-level" },
      round: -3,
      askedTopics: ["valid", 42, null],
    });

    const result = parseDiscoveryState(raw);

    expect(result.collectedInfo.product_vision).toBe("An app");
    expect(result.confidence.product_vision).toBe("sufficient");
    expect(result.confidence.target_users).toBe("unknown");
    expect(result.round).toBe(0);
    expect(result.askedTopics).toEqual(["valid"]);
  });
});

describe("planning brief (de)serialization", () => {
  const brief: TddPlanningBrief = {
    productSummary: "A two-sided laundry pickup-and-delivery marketplace.",
    targetUsers: ["Customers needing laundry done", "Laundromat operators"],
    primaryUserJourneys: ["Customer requests pickup", "Operator accepts and fulfills the order"],
    featureBreakdown: {
      mustHave: ["Order placement", "Operator matching", "Payments"],
      niceToHave: ["Loyalty rewards"],
      outOfScope: ["In-house delivery fleet"],
    },
    domainEntities: [
      {
        name: "Order",
        description: "A laundry order placed by a customer",
        relationships: ["belongs to Customer", "fulfilled by Operator"],
      },
    ],
    technicalConsiderations: {
      platform: "Mobile apps (iOS/Android) + web admin",
      architectureStyle: "Marketplace with an order-matching service",
      integrations: ["Stripe", "Twilio"],
      scaleAssumptions: "Hundreds of orders per day at launch",
    },
    constraintsAndRisks: ["Limited launch budget"],
    openQuestionsAndAssumptions: ["Assumed payments are handled via Stripe"],
    tddOutline: ["Overview", "Architecture", "Data model", "API design", "Open questions"],
  };

  test("round-trips a valid brief", () => {
    expect(parsePlanningBrief(serializePlanningBrief(brief))).toEqual(brief);
  });

  test("returns null for missing, invalid, or schema-incomplete input", () => {
    expect(parsePlanningBrief(null)).toBeNull();
    expect(parsePlanningBrief(undefined)).toBeNull();
    expect(parsePlanningBrief("{not json")).toBeNull();
    expect(parsePlanningBrief(JSON.stringify({ productSummary: "incomplete" }))).toBeNull();
  });

  test("a fully-populated brief satisfies the structured-output schema", () => {
    expect(tddPlanningBriefSchema.safeParse(brief).success).toBe(true);
  });
});
