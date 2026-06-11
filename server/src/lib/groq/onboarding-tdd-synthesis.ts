import type { Bindings } from "../common/types";
import { generateGeminiJson, parseJsonFromGeminiText } from "../gemini/gemini-client";
import type { TddBlockType, TddPlanningBrief } from "../onboarding/tdd-types";
import { createDefaultTddBlocks, TDD_BLOCK_TITLES } from "../onboarding/tdd-types";

const SYNTHESIS_SYSTEM_PROMPT =
  "You are a principal architect producing a Test-Driven Development (TDD) document for Brisk onboarding. " +
  "Synthesize the TDD Planning Brief into four structured markdown sections. Always reply with strict JSON only.";

function buildSynthesisPrompt(projectName: string, description: string, brief: TddPlanningBrief): string {
  return [
    `Project title: ${projectName}`,
    `Project idea: ${description}`,
    "",
    "TDD Planning Brief:",
    `Product summary: ${brief.productSummary}`,
    `Target users: ${brief.targetUsers.join("; ") || "(none specified)"}`,
    `Primary user journeys: ${brief.primaryUserJourneys.join("; ") || "(none specified)"}`,
    `Must-have features: ${brief.featureBreakdown.mustHave.join("; ") || "(none specified)"}`,
    `Nice-to-have features: ${brief.featureBreakdown.niceToHave.join("; ") || "(none)"}`,
    `Out of scope: ${brief.featureBreakdown.outOfScope.join("; ") || "(none)"}`,
    `Domain entities: ${
      brief.domainEntities
        .map((entity) => `${entity.name} (${entity.description}) — relationships: ${entity.relationships.join(", ") || "none"}`)
        .join("; ") || "(none specified)"
    }`,
    `Technical considerations: platform=${brief.technicalConsiderations.platform}; architecture=${brief.technicalConsiderations.architectureStyle}; integrations=${brief.technicalConsiderations.integrations.join(", ") || "none"}; scale=${brief.technicalConsiderations.scaleAssumptions}`,
    `Constraints & risks: ${brief.constraintsAndRisks.join("; ") || "(none specified)"}`,
    `Open questions & assumptions: ${brief.openQuestionsAndAssumptions.join("; ") || "(none)"}`,
    `Suggested TDD outline: ${brief.tddOutline.join(" -> ")}`,
    "",
    "Respond with ONLY a JSON object:",
    '{"project_overview": "<markdown>", "core_features": "<markdown>", "database_schema": "<markdown with tables>", "tdd_specs": "<markdown with Arrange-Act-Assert blocks>"}',
    "Rules:",
    "- project_overview: executive summary, value prop, target users, and primary user journeys",
    "- core_features: detailed operational mechanics for the must-have (and notable nice-to-have) features, organized using the suggested TDD outline where relevant",
    "- database_schema: markdown tables describing the domain entities, their fields, and relationships",
    "- tdd_specs: numbered test cases with Arrange / Act / Assert sections covering the must-have features, accounting for the open questions and assumptions",
  ].join("\n");
}

function normalizeSection(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function synthesizeTddDocument(
  bindings: Bindings,
  projectName: string,
  description: string,
  brief: TddPlanningBrief,
) {
  const text = await generateGeminiJson(bindings, {
    systemPrompt: SYNTHESIS_SYSTEM_PROMPT,
    userPrompt: buildSynthesisPrompt(projectName, description, brief),
  });

  let parsed: unknown;
  try {
    parsed = parseJsonFromGeminiText(text);
  } catch {
    throw new Error("TDD synthesis response was not valid JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("TDD synthesis response was not a JSON object.");
  }

  const record = parsed as Record<string, unknown>;
  const contentByType: Partial<Record<TddBlockType, string>> = {
    project_overview: normalizeSection(record.project_overview),
    core_features: normalizeSection(record.core_features),
    database_schema: normalizeSection(record.database_schema),
    tdd_specs: normalizeSection(record.tdd_specs),
  };

  for (const [type, title] of Object.entries(TDD_BLOCK_TITLES)) {
    const key = type as TddBlockType;
    if (!contentByType[key]) {
      contentByType[key] = `## ${title}\n\n_Content pending refinement._`;
    }
  }

  return createDefaultTddBlocks(contentByType);
}
