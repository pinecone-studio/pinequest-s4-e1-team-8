import {
  RUBRIC_CATEGORIES,
  RUBRIC_CATEGORY_LABELS,
  type CollectedInfo,
  type ConfidenceMap,
} from "./discovery.types";
import type { OnboardingTranscriptMessage } from "../../lib/onboarding/tdd-types";

/**
 * Prompt templates for the self-managing onboarding discovery agent.
 *
 * Each node binds its model with `.withStructuredOutput(<zodSchema>)`, so
 * these prompts focus on *what to think about* and *how to phrase the
 * response* — the JSON shape itself is enforced by the schema, not by
 * prompt instructions.
 *
 * Tune question pacing / tone here without touching graph or node logic.
 */

function formatTranscript(messages: OnboardingTranscriptMessage[]): string {
  if (messages.length === 0) {
    return "(no answers yet — only the initial project name and description below)";
  }

  return messages
    .map((message) => `${message.role === "user" ? "Founder" : "Agent"}: ${message.content}`)
    .join("\n");
}

function formatRubric(): string {
  return RUBRIC_CATEGORIES.map((category) => `- ${category}: ${RUBRIC_CATEGORY_LABELS[category]}`).join("\n");
}

function formatCollectedInfo(collectedInfo: CollectedInfo, confidence: ConfidenceMap): string {
  return RUBRIC_CATEGORIES.map((category) => {
    const note = collectedInfo[category]?.trim() || "(nothing captured yet)";
    return `- ${category} [${confidence[category]}]: ${note}`;
  }).join("\n");
}

// ---------------------------------------------------------------------------
// analyzeResponses
// ---------------------------------------------------------------------------

export const ANALYZE_SYSTEM_PROMPT = [
  "You are the analysis stage of a product-discovery agent.",
  "Your job is to read everything the founder has said so far (project name, description, and any answers)",
  "and produce an up-to-date picture of what is known about the product across a fixed set of categories.",
  "",
  "Rules:",
  "- Re-derive the picture from the FULL conversation each time, not just the newest message — earlier",
  "  answers may be clarified or contradicted later, and a single answer can speak to multiple categories.",
  "- Be generous about INFERENCE. If the founder uses an analogy (e.g. 'like Airbnb for camper vans'),",
  "  infer the implications (two-sided marketplace, listings, bookings, payments, reviews, host & guest",
  "  user types) and reflect that in the relevant categories — don't wait for it to be spelled out.",
  "- 'collectedInfo' for each category is a short plain-language note (1-3 sentences) summarizing what is",
  "  known. If nothing is known yet, leave it as an empty string.",
  "- 'confidence' for each category must be one of:",
  "    unknown    — nothing meaningful is known yet",
  "    partial    — there's a useful starting point but real gaps or ambiguity remain",
  "    sufficient — there's enough detail here to design around without major open questions",
  "- Every one of the 8 categories must be present in both 'collectedInfo' and 'confidence', even if empty/unknown.",
].join("\n");

export type AnalyzePromptParams = {
  projectName: string;
  description: string;
  messages: OnboardingTranscriptMessage[];
  collectedInfo: CollectedInfo;
  confidence: ConfidenceMap;
};

export function buildAnalyzeUserPrompt(params: AnalyzePromptParams): string {
  return [
    `Project name: ${params.projectName || "(untitled)"}`,
    `Project description: ${params.description || "(no description provided yet)"}`,
    "",
    "Categories to assess:",
    formatRubric(),
    "",
    "Current understanding (from the previous round, may be empty on the first round):",
    formatCollectedInfo(params.collectedInfo, params.confidence),
    "",
    "Conversation so far:",
    formatTranscript(params.messages),
    "",
    "Update 'collectedInfo' and 'confidence' for all 8 categories based on everything above.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// generateQuestions
// ---------------------------------------------------------------------------

export const GENERATE_QUESTIONS_SYSTEM_PROMPT = [
  "You are the questioning stage of a product-discovery agent talking to a non-technical founder.",
  "Your job is to ask the smallest set of questions that will most increase confidence in the categories",
  "that are still unclear.",
  "",
  "Rules:",
  "- Produce between 2 and 4 questions, grouped into ONE round (the founder will answer them together).",
  "- Plain language only. No jargon (no 'schema', 'API', 'auth', 'backend', 'database', etc.). Ask about",
  "  the product and its users the way a friendly co-founder would.",
  "- Each question should clearly map back to one of the 8 rubric categories (set 'category' accordingly)",
  "  and should target categories that are currently 'unknown' or 'partial', prioritizing the highest-impact",
  "  gaps described in the sufficiency notes below.",
  "- Give each question a short 'topic' tag (2-4 words, snake_case) describing its specific sub-topic —",
  "  this is used to make sure we never ask about the same sub-topic twice across rounds.",
  "- NEVER ask about a topic listed in 'Already asked topics' below, even rephrased.",
  "- Where it lowers effort for the founder, include 1-3 short 'examples' — either example answers or",
  "  multiple-choice style options — phrased so the founder could just say 'the second one' or paste one in.",
  "- Each question should help the founder picture their product more clearly, not feel like an interrogation.",
].join("\n");

export type GenerateQuestionsPromptParams = {
  projectName: string;
  description: string;
  collectedInfo: CollectedInfo;
  confidence: ConfidenceMap;
  askedTopics: string[];
  round: number;
  sufficiencyReasoning: string;
};

export function buildGenerateQuestionsUserPrompt(params: GenerateQuestionsPromptParams): string {
  return [
    `Project name: ${params.projectName || "(untitled)"}`,
    `Project description: ${params.description || "(no description provided yet)"}`,
    `This will be question round ${params.round + 1}.`,
    "",
    "Current understanding per category:",
    formatCollectedInfo(params.collectedInfo, params.confidence),
    "",
    `Sufficiency notes (what's still missing): ${params.sufficiencyReasoning || "(none yet)"}`,
    "",
    `Already asked topics (do not repeat): ${
      params.askedTopics.length > 0 ? params.askedTopics.join(", ") : "(none yet)"
    }`,
    "",
    "Generate this round's 2-4 questions now.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// synthesizePlan
// ---------------------------------------------------------------------------

export const SYNTHESIZE_PLAN_SYSTEM_PROMPT = [
  "You are the synthesis stage of a product-discovery agent. The discovery interview is complete (either",
  "because enough is known, or because the round limit was reached).",
  "",
  "Produce a 'TDD Planning Brief': a structured plan that a future step will use to generate a full",
  "Technical Design Document. This is NOT the TDD itself — keep it at planning altitude.",
  "",
  "Rules:",
  "- 'productSummary' is a clean, one-paragraph restatement of the product vision in plain language.",
  "- 'featureBreakdown' splits features into mustHave / niceToHave / outOfScope based on what the founder",
  "  emphasized vs mentioned in passing vs explicitly excluded.",
  "- 'domainEntities' lists the key things the system stores/manages (e.g. 'Listing', 'Booking', 'User'),",
  "  each with a short description and any notable relationships to other entities.",
  "- 'technicalConsiderations' captures platform/product type, a suggested architecture style, integrations,",
  "  and scale/availability assumptions — inferred even if the founder didn't use technical language.",
  "- 'openQuestionsAndAssumptions' MUST explicitly call out every category whose confidence below is",
  "  'unknown' or 'partial': state the assumption you made to proceed and the question that should be",
  "  revisited later.",
  "- 'tddOutline' is a list of section headings (5-9 items) that the future TDD generator should fill in —",
  "  e.g. 'Overview & Goals', 'User Roles & Permissions', 'Data Model', 'Core Workflows', 'Integrations',",
  "  'Non-Functional Requirements', 'Open Questions'. Tailor the headings to this specific product.",
].join("\n");

export type SynthesizePlanPromptParams = {
  projectName: string;
  description: string;
  collectedInfo: CollectedInfo;
  confidence: ConfidenceMap;
  messages: OnboardingTranscriptMessage[];
};

export function buildSynthesizePlanUserPrompt(params: SynthesizePlanPromptParams): string {
  return [
    `Project name: ${params.projectName || "(untitled)"}`,
    `Project description: ${params.description || "(no description provided yet)"}`,
    "",
    "Final understanding per category (use the confidence level to decide what belongs in",
    "openQuestionsAndAssumptions):",
    formatCollectedInfo(params.collectedInfo, params.confidence),
    "",
    "Full conversation:",
    formatTranscript(params.messages),
    "",
    "Produce the TDD Planning Brief now.",
  ].join("\n");
}
