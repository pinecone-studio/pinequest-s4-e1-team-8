import type { Bindings } from "../common/types";
import { generateGeminiText } from "../gemini/gemini-client";
import type {
  AnalyticsMetricsMatrix,
  BottleneckVector,
  CycleMetricsAggregation,
  SprintCompletionPath,
} from "./analytics-metrics.types";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function parseSprintCompletionPaths(value: unknown): SprintCompletionPath[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const path = entry as Record<string, unknown>;
    if (
      typeof path.pathId !== "string" ||
      typeof path.milestone !== "string" ||
      typeof path.projectedCompletionDate !== "string" ||
      typeof path.confidence !== "number" ||
      !isStringArray(path.steps)
    ) {
      return [];
    }

    return [
      {
        pathId: path.pathId,
        milestone: path.milestone,
        projectedCompletionDate: path.projectedCompletionDate,
        confidence: path.confidence,
        steps: path.steps,
      },
    ];
  });
}

function parseBottleneckVectors(value: unknown): BottleneckVector[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const vector = entry as Record<string, unknown>;
    if (
      typeof vector.vectorId !== "string" ||
      typeof vector.area !== "string" ||
      typeof vector.severity !== "number" ||
      typeof vector.impact !== "string" ||
      typeof vector.mitigation !== "string"
    ) {
      return [];
    }

    return [
      {
        vectorId: vector.vectorId,
        area: vector.area,
        severity: vector.severity,
        impact: vector.impact,
        mitigation: vector.mitigation,
      },
    ];
  });
}

function parseMetricsMatrix(raw: string): AnalyticsMetricsMatrix | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const sprintCompletionPaths = parseSprintCompletionPaths(parsed.sprintCompletionPaths);
    const bottleneckVectors = parseBottleneckVectors(parsed.bottleneckVectors);

    if (sprintCompletionPaths.length === 0 && bottleneckVectors.length === 0) {
      return null;
    }

    return { sprintCompletionPaths, bottleneckVectors };
  } catch {
    return null;
  }
}

function buildFallbackMatrix(aggregation: CycleMetricsAggregation): AnalyticsMetricsMatrix {
  const blockedRatio =
    aggregation.statusDistribution.IN_PROGRESS > 0
      ? aggregation.statusDistribution.IN_PROGRESS /
        Math.max(aggregation.completedCycles.length, 1)
      : 0;

  return {
    sprintCompletionPaths: [
      {
        pathId: "path-default",
        milestone: "Current sprint",
        projectedCompletionDate: new Date(
          Date.now() + aggregation.averageCompletionDays * 86400000,
        ).toISOString().slice(0, 10),
        confidence: aggregation.completionVelocity > 0 ? 0.65 : 0.35,
        steps: [
          "Clear blocked tasks",
          "Finish in-progress work",
          "Close remaining sprint items",
        ],
      },
    ],
    bottleneckVectors: [
      {
        vectorId: "vector-default",
        area: "Delivery throughput",
        severity: blockedRatio > 1 ? 0.8 : 0.45,
        impact: `${aggregation.statusDistribution.IN_PROGRESS} tasks remain in progress`,
        mitigation: "Prioritize blocked and high-priority tasks before new intake",
      },
    ],
  };
}

export async function processMetricsMatrix(
  bindings: Bindings,
  aggregation: CycleMetricsAggregation,
): Promise<AnalyticsMetricsMatrix> {
  const prompt = [
    "You are a sprint analytics engine.",
    "Analyze the cycle metrics and return ONLY valid JSON matching this schema:",
    '{"sprintCompletionPaths":[{"pathId":"string","milestone":"string","projectedCompletionDate":"YYYY-MM-DD","confidence":0.0,"steps":["string"]}],"bottleneckVectors":[{"vectorId":"string","area":"string","severity":0.0,"impact":"string","mitigation":"string"}]}',
    "Use confidence and severity values between 0 and 1.",
    "",
    JSON.stringify(aggregation),
  ].join("\n");

  try {
    const text = await generateGeminiText(bindings, prompt);
    const matrix = parseMetricsMatrix(text);
    if (matrix) {
      return matrix;
    }
  } catch {
    return buildFallbackMatrix(aggregation);
  }

  return buildFallbackMatrix(aggregation);
}
