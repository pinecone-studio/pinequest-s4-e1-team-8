export type ContextualSuggestion = {
  display_label: string;
  text_to_inject: string;
};

export type TddBlockType =
  | "project_overview"
  | "core_features"
  | "database_schema"
  | "tdd_specs";

export type TddBlock = {
  id: string;
  type: TddBlockType;
  title: string;
  content: string;
  order: number;
};

export type TddLayoutState = {
  blocks: TddBlock[];
};

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

export type DiscoveryQuestion = {
  id: string;
  category: RubricCategory;
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

export type OnboardingTranscriptMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Discovery round this message belongs to (assistant messages that ask questions). */
  round?: number;
  /** Grouped questions asked in this round, present on assistant messages. */
  questions?: DiscoveryQuestion[];
};

export type OnboardingSessionStatus = "INTERVIEWING" | "CANVAS_EDIT" | "CONCLUDED";

export type OnboardingSessionRecord = {
  id: string;
  userId: string;
  transcript: OnboardingTranscriptMessage[];
  tddLayoutState: TddLayoutState | null;
  planningBrief: TddPlanningBrief | null;
  status: OnboardingSessionStatus;
  docUrl: string | null;
  createdAt: string;
};

export const TDD_BLOCK_DEFAULTS: Record<TddBlockType, { title: string }> = {
  project_overview: { title: "Project Overview & Value Prop" },
  core_features: { title: "Core Features & Operational Mechanics" },
  database_schema: { title: "Database Schema Matrix" },
  tdd_specs: { title: "Test-Driven Development Specifications" },
};

export function createDefaultTddBlocks(contentByType?: Partial<Record<TddBlockType, string>>): TddBlock[] {
  const types: TddBlockType[] = [
    "project_overview",
    "core_features",
    "database_schema",
    "tdd_specs",
  ];
  return types.map((type, index) => ({
    id: `tdd-${type}`,
    type,
    title: TDD_BLOCK_DEFAULTS[type].title,
    content: contentByType?.[type] ?? "",
    order: index,
  }));
}
