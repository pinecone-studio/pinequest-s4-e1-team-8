import type { Bindings } from "../common/types";
import { generateGeminiText } from "../gemini/gemini-client";
import { riskSeverityEnum, type RiskSeverity } from "../../schema/project-risk.model";
import type {
  ProjectRiskEvaluation,
  ProjectRiskMetrics,
  RiskBottleneck,
} from "./risk-analysis.types";

function isRiskSeverity(value: unknown): value is RiskSeverity {
  return typeof value === "string" && (riskSeverityEnum as readonly string[]).includes(value);
}

function parseBottlenecks(value: unknown): RiskBottleneck[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const bottleneck = entry as Record<string, unknown>;
    if (
      typeof bottleneck.bottleneckId !== "string" ||
      (bottleneck.category !== "Capacity" &&
        bottleneck.category !== "Schedule" &&
        bottleneck.category !== "Blocker") ||
      typeof bottleneck.description !== "string" ||
      !isRiskSeverity(bottleneck.severity) ||
      typeof bottleneck.recommendation !== "string"
    ) {
      return [];
    }

    return [
      {
        bottleneckId: bottleneck.bottleneckId,
        category: bottleneck.category,
        description: bottleneck.description,
        severity: bottleneck.severity,
        recommendation: bottleneck.recommendation,
      },
    ];
  });
}

function parseEvaluation(raw: string): ProjectRiskEvaluation | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!isRiskSeverity(parsed.overallSeverity)) {
      return null;
    }

    const bottlenecks = parseBottlenecks(parsed.bottlenecks);
    if (bottlenecks.length === 0) {
      return null;
    }

    return { overallSeverity: parsed.overallSeverity, bottlenecks };
  } catch {
    return null;
  }
}

function rankSeverity(severity: RiskSeverity): number {
  return riskSeverityEnum.indexOf(severity);
}

function buildFallbackEvaluation(metrics: ProjectRiskMetrics): ProjectRiskEvaluation {
  const bottlenecks: RiskBottleneck[] = [];

  if (metrics.capacityRisks.length > 0) {
    const severity: RiskSeverity = metrics.capacityRisks.length > 2 ? "High" : "Medium";
    bottlenecks.push({
      bottleneckId: "capacity-default",
      category: "Capacity",
      description: `${metrics.capacityRisks.length} of ${metrics.activeMemberCount} team members carry no active task assignments`,
      severity,
      recommendation: "Rebalance active task assignments across idle team members",
    });
  }

  if (metrics.pastDueMilestones.length > 0) {
    const severity: RiskSeverity = metrics.pastDueMilestones.length > 2 ? "Critical" : "High";
    bottlenecks.push({
      bottleneckId: "schedule-default",
      category: "Schedule",
      description: `${metrics.pastDueMilestones.length} milestone(s) are past their due date`,
      severity,
      recommendation: "Re-baseline milestone due dates and escalate the most overdue items",
    });
  }

  if (metrics.openBlockers.length > 0) {
    const severity: RiskSeverity = metrics.openBlockers.length > 2 ? "Critical" : "High";
    bottlenecks.push({
      bottleneckId: "blocker-default",
      category: "Blocker",
      description: `${metrics.openBlockers.length} task(s) remain blocked`,
      severity,
      recommendation: "Triage open blockers with the assignees and owning sub-teams",
    });
  }

  if (bottlenecks.length === 0) {
    bottlenecks.push({
      bottleneckId: "baseline-default",
      category: "Capacity",
      description: "No structural bottlenecks were detected from the current project metrics",
      severity: "Low",
      recommendation: "Continue monitoring capacity, schedule, and blocker signals",
    });
  }

  const overallSeverity = bottlenecks.reduce<RiskSeverity>(
    (highest, bottleneck) => (rankSeverity(bottleneck.severity) > rankSeverity(highest) ? bottleneck.severity : highest),
    "Low",
  );

  return { overallSeverity, bottlenecks };
}

export async function evaluateProjectRisk(
  bindings: Bindings,
  metrics: ProjectRiskMetrics,
): Promise<ProjectRiskEvaluation> {
  const prompt = [
    "You are a proactive delivery risk evaluator.",
    "Analyze the unpolished project risk metrics and return ONLY valid JSON matching this schema:",
    '{"overallSeverity":"Low|Medium|High|Critical","bottlenecks":[{"bottleneckId":"string","category":"Capacity|Schedule|Blocker","description":"string","severity":"Low|Medium|High|Critical","recommendation":"string"}]}',
    "Severity tiers must be exactly one of Low, Medium, High, or Critical.",
    "",
    JSON.stringify(metrics),
  ].join("\n");

  try {
    const text = await generateGeminiText(bindings, prompt);
    const evaluation = parseEvaluation(text);
    if (evaluation) {
      return evaluation;
    }
  } catch {
    return buildFallbackEvaluation(metrics);
  }

  return buildFallbackEvaluation(metrics);
}
