import type { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { describe, expect, test } from "bun:test";
import type { OnboardingTranscriptMessage } from "../../lib/onboarding/tdd-types";
import {
  analyzeResultSchema,
  createDefaultCollectedInfo,
  createDefaultConfidence,
  generateQuestionsResultSchema,
  RUBRIC_CATEGORIES,
  tddPlanningBriefSchema,
  type AnalyzeResult,
  type GenerateQuestionsResult,
  type TddPlanningBrief,
} from "./discovery.types";
import { createDiscoveryGraph } from "./discoveryGraph";
import { HARD_ROUND_CAP } from "./rubric";

type FakeResponses = {
  analyze: AnalyzeResult;
  questions?: GenerateQuestionsResult;
  brief?: TddPlanningBrief;
};

/**
 * Stands in for `ChatGoogleGenerativeAI`. Each node calls
 * `model.withStructuredOutput(<schema>)`, so we dispatch on the (singleton)
 * schema reference to decide which canned response to return.
 */
function createFakeModel(responses: FakeResponses): ChatGoogleGenerativeAI {
  return {
    withStructuredOutput(schema: unknown) {
      return {
        invoke: async () => {
          if (schema === analyzeResultSchema) return responses.analyze;
          if (schema === generateQuestionsResultSchema) {
            if (!responses.questions) throw new Error("no questions response configured");
            return responses.questions;
          }
          if (schema === tddPlanningBriefSchema) {
            if (!responses.brief) throw new Error("no brief response configured");
            return responses.brief;
          }
          throw new Error("unexpected schema passed to withStructuredOutput");
        },
      };
    },
  } as unknown as ChatGoogleGenerativeAI;
}

const baseInput = {
  projectName: "Laundry App",
  description: "Uber for laundry",
  messages: [] as OnboardingTranscriptMessage[],
  collectedInfo: createDefaultCollectedInfo(),
  confidence: createDefaultConfidence(),
  round: 0,
  askedTopics: [] as string[],
  pendingQuestions: [],
  sufficiencyDecision: null,
  sufficiencyReasoning: "",
  brief: null,
};

const minimalBrief: TddPlanningBrief = {
  productSummary: "A two-sided laundry pickup-and-delivery marketplace.",
  targetUsers: ["Customers", "Laundromat operators"],
  primaryUserJourneys: ["Customer requests pickup and delivery", "Operator fulfills and returns the order"],
  featureBreakdown: {
    mustHave: ["Order placement", "Operator matching", "Payments"],
    niceToHave: ["Loyalty program"],
    outOfScope: ["Same-day delivery guarantee"],
  },
  domainEntities: [
    {
      name: "Order",
      description: "A laundry order placed by a customer",
      relationships: ["belongs to Customer", "fulfilled by Operator"],
    },
  ],
  technicalConsiderations: {
    platform: "Mobile apps for customers and operators, web admin dashboard",
    architectureStyle: "Marketplace with an order-matching service",
    integrations: ["Stripe", "Push notifications"],
    scaleAssumptions: "Low hundreds of daily orders at launch",
  },
  constraintsAndRisks: ["Small initial team", "Tight launch timeline"],
  openQuestionsAndAssumptions: ["Assumed operators are vetted manually at launch"],
  tddOutline: ["Overview", "User roles", "Core flows", "Data model", "Integrations", "Open questions"],
};

describe("createDiscoveryGraph", () => {
  test("routes to generateQuestions while coverage is incomplete", async () => {
    const analyze: AnalyzeResult = {
      collectedInfo: { ...createDefaultCollectedInfo(), product_vision: "A laundry pickup marketplace" },
      confidence: { ...createDefaultConfidence(), product_vision: "partial" },
    };
    const questions: GenerateQuestionsResult = {
      questions: [
        { id: "q1", category: "target_users", topic: "Target customers", prompt: "Who will use this app?" },
        { id: "q2", category: "core_features", topic: "Core features", prompt: "What are the must-have features?" },
      ],
    };

    const graph = createDiscoveryGraph(createFakeModel({ analyze, questions }));
    const result = await graph.invoke(baseInput);

    expect(result.sufficiencyDecision).toBe("ask_more");
    expect(result.round).toBe(1);
    expect(result.pendingQuestions).toHaveLength(2);
    expect(result.askedTopics).toEqual(["Target customers", "Core features"]);
    expect(result.brief).toBeNull();
  });

  test("routes to synthesizePlan once every category clears the sufficiency bar", async () => {
    const confidence = { ...createDefaultConfidence() };
    for (const category of RUBRIC_CATEGORIES) {
      confidence[category] = "sufficient";
    }
    const analyze: AnalyzeResult = {
      collectedInfo: { ...createDefaultCollectedInfo(), product_vision: "A laundry pickup marketplace" },
      confidence,
    };

    const graph = createDiscoveryGraph(createFakeModel({ analyze, brief: minimalBrief }));
    const result = await graph.invoke({ ...baseInput, round: 2 });

    expect(result.sufficiencyDecision).toBe("synthesize");
    expect(result.brief).toEqual(minimalBrief);
    expect(result.pendingQuestions).toEqual([]);
  });

  test("hits the hard cap and synthesizes even with incomplete coverage", async () => {
    const analyze: AnalyzeResult = {
      collectedInfo: createDefaultCollectedInfo(),
      confidence: createDefaultConfidence(),
    };

    const graph = createDiscoveryGraph(createFakeModel({ analyze, brief: minimalBrief }));
    const result = await graph.invoke({ ...baseInput, round: HARD_ROUND_CAP });

    expect(result.sufficiencyDecision).toBe("synthesize");
    expect(result.sufficiencyReasoning).toContain("Hard cap");
    expect(result.brief).toEqual(minimalBrief);
  });
});
