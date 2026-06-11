import { z } from "zod";

export const RUBRIC_CATEGORIES = [
  "product_vision",
  "target_users",
  "core_features",
  "platform_type",
  "data_entities",
  "integrations",
  "scale_performance",
  "constraints",
] as const;

export type RubricCategory = (typeof RUBRIC_CATEGORIES)[number];

/**
 * Categories that must reach "sufficient" confidence before the agent will
 * synthesize a plan. Every category (high-impact or not) must reach at
 * least "partial".
 */
export const HIGH_IMPACT_CATEGORIES: RubricCategory[] = [
  "product_vision",
  "target_users",
  "core_features",
  "platform_type",
  "data_entities",
];

export const RUBRIC_CATEGORY_LABELS: Record<RubricCategory, string> = {
  product_vision: "Product vision & problem being solved",
  target_users: "Target users & primary user journeys",
  core_features: "Core features (must-have vs nice-to-have)",
  platform_type: "Platform & product type",
  data_entities: "Data & domain entities",
  integrations: "Integrations & third-party services",
  scale_performance: "Scale, performance & availability expectations",
  constraints: "Constraints (tech stack, team, budget, timeline, compliance)",
};

export const CONFIDENCE_LEVELS = ["unknown", "partial", "sufficient"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export type CollectedInfo = Record<RubricCategory, string>;
export type ConfidenceMap = Record<RubricCategory, ConfidenceLevel>;

export type SufficiencyDecision = "ask_more" | "synthesize";

export type DiscoveryQuestion = {
  id: string;
  category: RubricCategory;
  /** Short tag identifying the sub-topic, used to enforce the no-repeat rule. */
  topic: string;
  prompt: string;
  examples?: string[];
};

export type TddPlanningBrief = {
  productSummary: string;
  targetUsers: string[];
  primaryUserJourneys: string[];
  featureBreakdown: {
    mustHave: string[];
    niceToHave: string[];
    outOfScope: string[];
  };
  domainEntities: Array<{
    name: string;
    description: string;
    relationships: string[];
  }>;
  technicalConsiderations: {
    platform: string;
    architectureStyle: string;
    integrations: string[];
    scaleAssumptions: string;
  };
  constraintsAndRisks: string[];
  openQuestionsAndAssumptions: string[];
  tddOutline: string[];
};

/** State persisted to the `onboarding_sessions.discovery_state` column between turns. */
export type PersistedDiscoveryState = {
  collectedInfo: CollectedInfo;
  confidence: ConfidenceMap;
  round: number;
  askedTopics: string[];
  sufficiencyReasoning?: string;
};

// ---------------------------------------------------------------------------
// zod schemas (used for LLM structured output)
// ---------------------------------------------------------------------------

export const confidenceLevelSchema = z.enum(CONFIDENCE_LEVELS);

export const collectedInfoSchema = z.object(
  Object.fromEntries(RUBRIC_CATEGORIES.map((category) => [category, z.string()])) as Record<
    RubricCategory,
    z.ZodString
  >,
);

// NOTE: each property gets its own `z.enum(...)` instance (rather than reusing
// `confidenceLevelSchema`) because `withStructuredOutput` converts this schema
// to a Gemini `response_schema` via zod-to-json-schema, which emits `$ref`/`$defs`
// for repeated schema instances — a JSON Schema feature Gemini's API rejects.
export const confidenceMapSchema = z.object(
  Object.fromEntries(
    RUBRIC_CATEGORIES.map((category) => [category, z.enum(CONFIDENCE_LEVELS)]),
  ) as Record<RubricCategory, typeof confidenceLevelSchema>,
);

export const analyzeResultSchema = z.object({
  collectedInfo: collectedInfoSchema,
  confidence: confidenceMapSchema,
});
export type AnalyzeResult = z.infer<typeof analyzeResultSchema>;

export const discoveryQuestionSchema = z.object({
  id: z.string(),
  category: z.enum(RUBRIC_CATEGORIES),
  topic: z.string(),
  prompt: z.string(),
  examples: z.array(z.string()).optional(),
});

export const generateQuestionsResultSchema = z.object({
  questions: z.array(discoveryQuestionSchema).min(2).max(4),
});
export type GenerateQuestionsResult = z.infer<typeof generateQuestionsResultSchema>;

export const tddPlanningBriefSchema = z.object({
  productSummary: z.string(),
  targetUsers: z.array(z.string()),
  primaryUserJourneys: z.array(z.string()),
  featureBreakdown: z.object({
    mustHave: z.array(z.string()),
    niceToHave: z.array(z.string()),
    outOfScope: z.array(z.string()),
  }),
  domainEntities: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      relationships: z.array(z.string()),
    }),
  ),
  technicalConsiderations: z.object({
    platform: z.string(),
    architectureStyle: z.string(),
    integrations: z.array(z.string()),
    scaleAssumptions: z.string(),
  }),
  constraintsAndRisks: z.array(z.string()),
  openQuestionsAndAssumptions: z.array(z.string()),
  tddOutline: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// Defaults + (de)serialization helpers
// ---------------------------------------------------------------------------

export function createDefaultCollectedInfo(): CollectedInfo {
  return Object.fromEntries(RUBRIC_CATEGORIES.map((category) => [category, ""])) as CollectedInfo;
}

export function createDefaultConfidence(): ConfidenceMap {
  return Object.fromEntries(
    RUBRIC_CATEGORIES.map((category) => [category, "unknown" as ConfidenceLevel]),
  ) as ConfidenceMap;
}

export function createDefaultDiscoveryState(): PersistedDiscoveryState {
  return {
    collectedInfo: createDefaultCollectedInfo(),
    confidence: createDefaultConfidence(),
    round: 0,
    askedTopics: [],
  };
}

function isConfidenceLevel(value: unknown): value is ConfidenceLevel {
  return value === "unknown" || value === "partial" || value === "sufficient";
}

export function parseDiscoveryState(raw: string | null | undefined): PersistedDiscoveryState {
  const defaults = createDefaultDiscoveryState();
  if (!raw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const collectedInfo = { ...defaults.collectedInfo };
    if (parsed.collectedInfo && typeof parsed.collectedInfo === "object") {
      const record = parsed.collectedInfo as Record<string, unknown>;
      for (const category of RUBRIC_CATEGORIES) {
        const value = record[category];
        if (typeof value === "string") {
          collectedInfo[category] = value;
        }
      }
    }

    const confidence = { ...defaults.confidence };
    if (parsed.confidence && typeof parsed.confidence === "object") {
      const record = parsed.confidence as Record<string, unknown>;
      for (const category of RUBRIC_CATEGORIES) {
        const value = record[category];
        if (isConfidenceLevel(value)) {
          confidence[category] = value;
        }
      }
    }

    const round =
      typeof parsed.round === "number" && Number.isFinite(parsed.round)
        ? Math.max(0, Math.floor(parsed.round))
        : defaults.round;

    const askedTopics = Array.isArray(parsed.askedTopics)
      ? parsed.askedTopics.filter((topic): topic is string => typeof topic === "string")
      : defaults.askedTopics;

    const sufficiencyReasoning =
      typeof parsed.sufficiencyReasoning === "string" ? parsed.sufficiencyReasoning : undefined;

    return { collectedInfo, confidence, round, askedTopics, sufficiencyReasoning };
  } catch {
    return defaults;
  }
}

export function serializeDiscoveryState(state: PersistedDiscoveryState): string {
  return JSON.stringify(state);
}

export function parsePlanningBrief(raw: string | null | undefined): TddPlanningBrief | null {
  if (!raw) {
    return null;
  }

  try {
    const result = tddPlanningBriefSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function serializePlanningBrief(brief: TddPlanningBrief): string {
  return JSON.stringify(brief);
}
