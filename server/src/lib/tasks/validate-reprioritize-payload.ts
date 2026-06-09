import {
  reprioritizeUiPriorities,
  type ReprioritizeTaskUpdate,
  type ReprioritizeTasksBody,
  type ReprioritizeUiPriority,
  type ReprioritizeValidationResult,
} from "./reprioritize-payload.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isReprioritizeUiPriority(value: unknown): value is ReprioritizeUiPriority {
  return (
    typeof value === "string" &&
    (reprioritizeUiPriorities as readonly string[]).includes(value)
  );
}

function parseUpdate(
  value: unknown,
  index: number,
): { ok: true; data: ReprioritizeTaskUpdate } | { ok: false; error: string } {
  if (!isRecord(value)) {
    return { ok: false, error: `updates[${index}] must be an object.` };
  }

  if (!isNonEmptyString(value.taskId)) {
    return { ok: false, error: `updates[${index}].taskId is required.` };
  }

  if (!isReprioritizeUiPriority(value.priority)) {
    return {
      ok: false,
      error: `updates[${index}].priority must be one of Low, Medium, High.`,
    };
  }

  if (typeof value.sequenceOrder !== "number" || !Number.isFinite(value.sequenceOrder)) {
    return { ok: false, error: `updates[${index}].sequenceOrder must be a number.` };
  }

  if (!isStringArray(value.dependencyTaskIds)) {
    return {
      ok: false,
      error: `updates[${index}].dependencyTaskIds must be a string array.`,
    };
  }

  return {
    ok: true,
    data: {
      taskId: value.taskId,
      priority: value.priority,
      sequenceOrder: value.sequenceOrder,
      dependencyTaskIds: value.dependencyTaskIds,
    },
  };
}

export function validateReprioritizeBody(value: unknown): ReprioritizeValidationResult {
  if (!isRecord(value)) {
    return { ok: false, error: "Request body must be an object." };
  }

  if (!isNonEmptyString(value.projectId)) {
    return { ok: false, error: "projectId is required." };
  }

  if (!Array.isArray(value.updates) || value.updates.length === 0) {
    return { ok: false, error: "updates must be a non-empty array." };
  }

  const updates: ReprioritizeTaskUpdate[] = [];
  for (let index = 0; index < value.updates.length; index += 1) {
    const parsed = parseUpdate(value.updates[index], index);
    if (!parsed.ok) {
      return { ok: false, error: parsed.error };
    }
    updates.push(parsed.data);
  }

  const taskIds = new Set(updates.map((update) => update.taskId));
  if (taskIds.size !== updates.length) {
    return { ok: false, error: "updates must not contain duplicate taskId values." };
  }

  const body: ReprioritizeTasksBody = { projectId: value.projectId, updates };
  return { ok: true, data: body };
}
