import type { Bindings } from "../lib/common/types";
import { buildAnalyticsContext } from "../lib/analytics/build-analytics-context";
import type { Task } from "../schema/task.model";

const GEMINI_MODEL = "gemini-2.5-flash";

const SYSTEM_PROMPT =
  "You are an elite delivery analytics lead. Synthesize a concise markdown performance report from the supplied project metrics, milestone progress, and completed task tallies. Use clear headings, bullet lists, and short paragraphs. Focus on delivery velocity, milestone health, completion trends, and actionable next steps. Output markdown only.";

export type PerformanceReportMilestone = {
  id: string;
  title: string;
  status: string;
  progress: number;
  doneCount: number;
  blockedCount: number;
  dueDate: string | null;
};

export type PerformanceReportContext = {
  projectId: string;
  workspaceId: string;
  projectName: string;
  metrics: ReturnType<typeof buildAnalyticsContext>;
  milestones: PerformanceReportMilestone[];
  completedTaskTallies: {
    totalCompleted: number;
    milestoneCompleted: number;
    subtaskCompleted: number;
  };
};

export function buildPerformanceReportContext(
  projectId: string,
  workspaceId: string,
  projectName: string,
  rows: Task[],
): PerformanceReportContext {
  const milestones = rows
    .filter((row) => row.parentId === null)
    .map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      progress: row.progress,
      doneCount: row.doneCount,
      blockedCount: row.blockedCount,
      dueDate: row.dueDate,
    }));

  const completedRows = rows.filter((row) => row.status === "DONE");
  const completedMilestones = completedRows.filter((row) => row.parentId === null);
  const completedSubtasks = completedRows.filter((row) => row.parentId !== null);

  return {
    projectId,
    workspaceId,
    projectName,
    metrics: buildAnalyticsContext(rows),
    milestones,
    completedTaskTallies: {
      totalCompleted: completedRows.length,
      milestoneCompleted: completedMilestones.length,
      subtaskCompleted: completedSubtasks.length,
    },
  };
}

function buildPerformanceReportPrompt(context: PerformanceReportContext): string {
  return [
    `Project: ${context.projectName}`,
    `Project ID: ${context.projectId}`,
    `Workspace ID: ${context.workspaceId}`,
    "",
    `Metrics: ${JSON.stringify(context.metrics)}`,
    `Milestones: ${JSON.stringify(context.milestones)}`,
    `Completed task tallies: ${JSON.stringify(context.completedTaskTallies)}`,
    "",
    "Write a markdown performance synthesis for this active project.",
  ].join("\n");
}

type GeminiStreamChunk = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

function extractStreamText(payload: GeminiStreamChunk): string {
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === "string" ? text : "";
}

export async function* streamPerformanceReportSynthesis(
  bindings: Bindings,
  context: PerformanceReportContext,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const apiKey = bindings.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [{ parts: [{ text: buildPerformanceReportPrompt(context) }] }],
      }),
      signal,
    },
  );

  if (!response.ok || !response.body) {
    throw new Error("Gemini stream request failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) {
        continue;
      }

      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") {
        continue;
      }

      try {
        const parsed = JSON.parse(payload) as GeminiStreamChunk;
        const text = extractStreamText(parsed);
        if (text.length > 0) {
          yield text;
        }
      } catch {
        continue;
      }
    }
  }
}
