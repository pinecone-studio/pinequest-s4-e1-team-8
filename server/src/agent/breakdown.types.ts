import type { TaskPriority, TaskStatus } from "../schema/task.model";

export type GeneratedTask = {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
};

export type GeneratedPhase = {
  name: string;
  description?: string;
  tasks: GeneratedTask[];
};

export type ProjectBreakdown = {
  projectTitle?: string;
  phases: GeneratedPhase[];
};

export function isProjectBreakdown(value: unknown): value is ProjectBreakdown {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  if (!Array.isArray(record.phases) || record.phases.length === 0) {
    return false;
  }

  return record.phases.every((phase) => {
    if (!phase || typeof phase !== "object") {
      return false;
    }

    const phaseRecord = phase as Record<string, unknown>;

    if (typeof phaseRecord.name !== "string" || !phaseRecord.name.trim()) {
      return false;
    }

    if (!Array.isArray(phaseRecord.tasks)) {
      return false;
    }

    return phaseRecord.tasks.every((task) => {
      if (!task || typeof task !== "object") {
        return false;
      }

      return typeof (task as Record<string, unknown>).title === "string";
    });
  });
}

export function parseBreakdownFromContent(content: string): ProjectBreakdown | null {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced?.[1] ?? trimmed).trim();

  try {
    const parsed: unknown = JSON.parse(candidate);
    return isProjectBreakdown(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
