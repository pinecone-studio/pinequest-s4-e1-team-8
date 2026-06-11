import type {
  ProvisionProjectInput,
  ProvisionProjectIntegrations,
} from "./provision-project.types";

export type ProvisionValidationResult =
  | { ok: true; data: ProvisionProjectInput }
  | { ok: false; error: string; field: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseIntegrations(
  value: unknown,
): ProvisionProjectIntegrations | null {
  if (!isRecord(value)) return null;

  const githubRepoOwner = readString(value, "githubRepoOwner");
  const githubRepoName = readString(value, "githubRepoName");
  const githubRepoId = readString(value, "githubRepoId");
  const githubProjectId = readString(value, "githubProjectId");
  const githubProjectTitle = readString(value, "githubProjectTitle");
  const asanaWorkspaceGid = readString(value, "asanaWorkspaceGid");
  const asanaProjectGid = readString(value, "asanaProjectGid");
  const asanaProjectName = readString(value, "asanaProjectName");

  if (
    !githubRepoOwner ||
    !githubRepoName ||
    !githubRepoId ||
    !githubProjectId ||
    !githubProjectTitle ||
    !asanaWorkspaceGid ||
    !asanaProjectGid ||
    !asanaProjectName
  ) {
    return null;
  }

  return {
    githubRepoOwner,
    githubRepoName,
    githubRepoId,
    githubProjectId,
    githubProjectTitle,
    asanaWorkspaceGid,
    asanaProjectGid,
    asanaProjectName,
  };
}

export function validateProvisionProject(
  body: unknown,
): ProvisionValidationResult {
  if (!isRecord(body)) {
    return { ok: false, error: "Request body must be an object", field: "body" };
  }

  const name = readString(body, "name");
  if (!name) {
    return { ok: false, error: "Project name is required", field: "name" };
  }

  const integrations = parseIntegrations(body.integrations);
  if (!integrations) {
    return {
      ok: false,
      error: "Complete GitHub and Asana integration selections are required",
      field: "integrations",
    };
  }

  const description =
    typeof body.description === "string" ? body.description.trim() : undefined;
  const workspaceId =
    typeof body.workspaceId === "string" ? body.workspaceId.trim() : undefined;

  return {
    ok: true,
    data: {
      name,
      description,
      workspaceId,
      integrations,
    },
  };
}
