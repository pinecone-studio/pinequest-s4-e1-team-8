import type {
  CollaboratorRole,
  InitializeProjectPayload,
  InitializeProjectValidationResult,
} from "./initialize-project.types";

const COLLABORATOR_ROLES: CollaboratorRole[] = [
  "Developer",
  "Designer",
  "Manager",
];

type StepParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; field: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string")
  );
}

function parseStep1(
  value: unknown,
): StepParseResult<InitializeProjectPayload["step1"]> {
  if (!isRecord(value)) {
    return { ok: false, error: "step1 must be an object.", field: "step1" };
  }

  if (!isNonEmptyString(value.projectName)) {
    return {
      ok: false,
      error: "step1.projectName is required.",
      field: "step1.projectName",
    };
  }

  if (typeof value.description !== "string") {
    return {
      ok: false,
      error: "step1.description must be a string.",
      field: "step1.description",
    };
  }

  if (!isNonEmptyString(value.timezone)) {
    return {
      ok: false,
      error: "step1.timezone is required.",
      field: "step1.timezone",
    };
  }

  return {
    ok: true,
    data: {
      projectName: value.projectName.trim(),
      description: value.description.trim(),
      timezone: value.timezone.trim(),
    },
  };
}

function parseStep2(
  value: unknown,
): StepParseResult<InitializeProjectPayload["step2"]> {
  if (!isRecord(value)) {
    return { ok: false, error: "step2 must be an object.", field: "step2" };
  }

  if (!Array.isArray(value.collaborators)) {
    return {
      ok: false,
      error: "step2.collaborators must be an array.",
      field: "step2.collaborators",
    };
  }

  const collaborators: InitializeProjectPayload["step2"]["collaborators"] = [];

  for (let index = 0; index < value.collaborators.length; index += 1) {
    const entry = value.collaborators[index];
    if (!isRecord(entry)) {
      return {
        ok: false,
        error: `step2.collaborators[${index}] must be an object.`,
        field: `step2.collaborators[${index}]`,
      };
    }

    if (!isNonEmptyString(entry.email)) {
      return {
        ok: false,
        error: `step2.collaborators[${index}].email is required.`,
        field: `step2.collaborators[${index}].email`,
      };
    }

    if (
      typeof entry.role !== "string" ||
      !COLLABORATOR_ROLES.includes(entry.role as CollaboratorRole)
    ) {
      return {
        ok: false,
        error: `step2.collaborators[${index}].role must be Developer, Designer, or Manager.`,
        field: `step2.collaborators[${index}].role`,
      };
    }

    collaborators.push({
      email: entry.email.trim().toLowerCase(),
      role: entry.role as CollaboratorRole,
    });
  }

  return { ok: true, data: { collaborators } };
}

function parseStep3(
  value: unknown,
): StepParseResult<InitializeProjectPayload["step3"]> {
  if (!isRecord(value)) {
    return { ok: false, error: "step3 must be an object.", field: "step3" };
  }

  if (!isBoolean(value.githubConnected)) {
    return {
      ok: false,
      error: "step3.githubConnected must be a boolean.",
      field: "step3.githubConnected",
    };
  }

  if (!isBoolean(value.asanaConnected)) {
    return {
      ok: false,
      error: "step3.asanaConnected must be a boolean.",
      field: "step3.asanaConnected",
    };
  }

  if (!isBoolean(value.isGithubDisconnected)) {
    return {
      ok: false,
      error: "step3.isGithubDisconnected must be a boolean.",
      field: "step3.isGithubDisconnected",
    };
  }

  if (!isBoolean(value.isAsanaDisconnected)) {
    return {
      ok: false,
      error: "step3.isAsanaDisconnected must be a boolean.",
      field: "step3.isAsanaDisconnected",
    };
  }

  return {
    ok: true,
    data: {
      githubConnected: value.githubConnected,
      asanaConnected: value.asanaConnected,
      isGithubDisconnected: value.isGithubDisconnected,
      isAsanaDisconnected: value.isAsanaDisconnected,
    },
  };
}

function parseStep4(
  value: unknown,
): StepParseResult<InitializeProjectPayload["step4"]> {
  if (!isRecord(value)) {
    return { ok: false, error: "step4 must be an object.", field: "step4" };
  }

  if (!Array.isArray(value.milestoneDrafts)) {
    return {
      ok: false,
      error: "step4.milestoneDrafts must be an array.",
      field: "step4.milestoneDrafts",
    };
  }

  const milestoneDrafts: InitializeProjectPayload["step4"]["milestoneDrafts"] = [];

  for (let index = 0; index < value.milestoneDrafts.length; index += 1) {
    const entry = value.milestoneDrafts[index];
    if (!isRecord(entry)) {
      return {
        ok: false,
        error: `step4.milestoneDrafts[${index}] must be an object.`,
        field: `step4.milestoneDrafts[${index}]`,
      };
    }

    if (!isNonEmptyString(entry.title)) {
      return {
        ok: false,
        error: `step4.milestoneDrafts[${index}].title is required.`,
        field: `step4.milestoneDrafts[${index}].title`,
      };
    }

    if (!isStringArray(entry.tasks)) {
      return {
        ok: false,
        error: `step4.milestoneDrafts[${index}].tasks must be a string array.`,
        field: `step4.milestoneDrafts[${index}].tasks`,
      };
    }

    if (!isBoolean(entry.isApproved)) {
      return {
        ok: false,
        error: `step4.milestoneDrafts[${index}].isApproved must be a boolean.`,
        field: `step4.milestoneDrafts[${index}].isApproved`,
      };
    }

    milestoneDrafts.push({
      title: entry.title.trim(),
      tasks: entry.tasks.map((task) => task.trim()).filter((task) => task.length > 0),
      isApproved: entry.isApproved,
    });
  }

  return { ok: true, data: { milestoneDrafts } };
}

export function validateInitializeProjectPayload(
  raw: unknown,
): InitializeProjectValidationResult {
  if (!isRecord(raw)) {
    return { ok: false, error: "Request body must be a JSON object.", field: "body" };
  }

  const step1 = parseStep1(raw.step1);
  if (!step1.ok) {
    return step1;
  }

  const step2 = parseStep2(raw.step2);
  if (!step2.ok) {
    return step2;
  }

  const step3 = parseStep3(raw.step3);
  if (!step3.ok) {
    return step3;
  }

  const step4 = parseStep4(raw.step4);
  if (!step4.ok) {
    return step4;
  }

  const workspaceId =
    raw.workspaceId === undefined
      ? undefined
      : isNonEmptyString(raw.workspaceId)
        ? raw.workspaceId.trim()
        : null;

  if (workspaceId === null) {
    return {
      ok: false,
      error: "workspaceId must be a non-empty string when provided.",
      field: "workspaceId",
    };
  }

  const projectId =
    raw.projectId === undefined
      ? undefined
      : isNonEmptyString(raw.projectId)
        ? raw.projectId.trim()
        : null;

  if (projectId === null) {
    return {
      ok: false,
      error: "projectId must be a non-empty string when provided.",
      field: "projectId",
    };
  }

  return {
    ok: true,
    data: {
      step1: step1.data,
      step2: step2.data,
      step3: step3.data,
      step4: step4.data,
      workspaceId,
      projectId,
    },
  };
}
