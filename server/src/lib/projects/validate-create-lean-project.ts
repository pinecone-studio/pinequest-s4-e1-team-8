import type {
  CreateLeanMilestoneInput,
  CreateLeanProjectInput,
} from "./create-lean-project.types";

const MAX_MILESTONES = 50;
const MIN_INVITE_EXPIRY_DAYS = 1;
const MAX_INVITE_EXPIRY_DAYS = 90;

type ValidationResult =
  | { ok: true; data: CreateLeanProjectInput }
  | { ok: false; error: string };

function normalizeMilestone(value: unknown, index: number): CreateLeanMilestoneInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title.trim() : "";
  if (!title) {
    return null;
  }

  const description =
    typeof record.description === "string" ? record.description.trim() : undefined;
  const dueDate =
    typeof record.dueDate === "string" ? record.dueDate.trim() : undefined;

  if (dueDate === "") {
    return { title, description: description || undefined };
  }

  return { title, description: description || undefined, dueDate };
}

export function validateCreateLeanProject(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  const record = body as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (!name) {
    return { ok: false, error: "name is required" };
  }

  if (!Array.isArray(record.milestones)) {
    return { ok: false, error: "milestones must be an array" };
  }

  if (record.milestones.length === 0) {
    return { ok: false, error: "At least one milestone is required" };
  }

  if (record.milestones.length > MAX_MILESTONES) {
    return {
      ok: false,
      error: `milestones cannot exceed ${MAX_MILESTONES} items per request`,
    };
  }

  const milestones = record.milestones
    .map((item, index) => normalizeMilestone(item, index))
    .filter((item): item is CreateLeanMilestoneInput => item !== null);

  if (milestones.length === 0) {
    return { ok: false, error: "Each milestone must include a non-empty title" };
  }

  const description =
    typeof record.description === "string" ? record.description.trim() : undefined;
  const workspaceId =
    typeof record.workspaceId === "string" ? record.workspaceId.trim() : undefined;
  const timezone =
    typeof record.timezone === "string" ? record.timezone.trim() : undefined;

  let inviteExpiresInDays = 14;
  if (record.inviteExpiresInDays !== undefined) {
    if (
      typeof record.inviteExpiresInDays !== "number" ||
      !Number.isInteger(record.inviteExpiresInDays)
    ) {
      return { ok: false, error: "inviteExpiresInDays must be an integer" };
    }
    if (
      record.inviteExpiresInDays < MIN_INVITE_EXPIRY_DAYS ||
      record.inviteExpiresInDays > MAX_INVITE_EXPIRY_DAYS
    ) {
      return {
        ok: false,
        error: `inviteExpiresInDays must be between ${MIN_INVITE_EXPIRY_DAYS} and ${MAX_INVITE_EXPIRY_DAYS}`,
      };
    }
    inviteExpiresInDays = record.inviteExpiresInDays;
  }

  return {
    ok: true,
    data: {
      name,
      description: description || undefined,
      workspaceId: workspaceId || undefined,
      timezone: timezone || undefined,
      inviteExpiresInDays,
      milestones,
    },
  };
}
