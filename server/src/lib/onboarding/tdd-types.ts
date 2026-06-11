import type { DiscoveryQuestion } from "../../agent/onboarding-discovery/discovery.types";

export * from "../../agent/onboarding-discovery/discovery.types";

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

export const TDD_BLOCK_TYPES: TddBlockType[] = [
  "project_overview",
  "core_features",
  "database_schema",
  "tdd_specs",
];

export const TDD_BLOCK_TITLES: Record<TddBlockType, string> = {
  project_overview: "Project Overview & Value Prop",
  core_features: "Core Features & Detailed Operational Mechanics",
  database_schema: "Database Schema Matrix",
  tdd_specs: "Actionable Test-Driven Development (TDD) Specifications",
};

export function createDefaultTddBlocks(
  contentByType?: Partial<Record<TddBlockType, string>>,
): TddBlock[] {
  return TDD_BLOCK_TYPES.map((type, index) => ({
    id: `tdd-${type}`,
    type,
    title: TDD_BLOCK_TITLES[type],
    content: contentByType?.[type] ?? "",
    order: index,
  }));
}

export function parseTddLayoutState(raw: string | null | undefined): TddLayoutState | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as TddLayoutState;
    if (!parsed || !Array.isArray(parsed.blocks)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function parseTranscript(raw: string | null | undefined): OnboardingTranscriptMessage[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as OnboardingTranscriptMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
