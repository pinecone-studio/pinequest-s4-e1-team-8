import type { InitializeProjectPayload } from "./initialize-project.types";

const ROLES = new Set(["Developer", "Designer", "Manager"]);

export function validateInitializeProject(
  body: unknown,
):
  | { ok: true; data: InitializeProjectPayload }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }

  const raw = body as Record<string, unknown>;
  const step1 = raw.step1 as Record<string, unknown> | undefined;
  const step2 = raw.step2 as Record<string, unknown> | undefined;
  const step3 = raw.step3 as Record<string, unknown> | undefined;
  const step4 = raw.step4 as Record<string, unknown> | undefined;

  if (!step1?.projectName || typeof step1.projectName !== "string") {
    return { ok: false, error: "step1.projectName is required" };
  }

  const collaborators = Array.isArray(step2?.collaborators)
    ? step2.collaborators
    : [];

  for (const entry of collaborators) {
    if (!entry || typeof entry !== "object") {
      return { ok: false, error: "Invalid collaborator entry" };
    }
    const collab = entry as Record<string, unknown>;
    if (typeof collab.email !== "string" || !collab.email.trim()) {
      return { ok: false, error: "Each collaborator needs an email" };
    }
    if (typeof collab.role !== "string" || !ROLES.has(collab.role)) {
      return { ok: false, error: "Invalid collaborator role" };
    }
  }

  const milestoneDrafts = Array.isArray(step4?.milestoneDrafts)
    ? step4.milestoneDrafts
    : [];

  const data: InitializeProjectPayload = {
    step1: {
      projectName: step1.projectName,
      description:
        typeof step1.description === "string" ? step1.description : "",
      timezone: typeof step1.timezone === "string" ? step1.timezone : "",
    },
    step2: {
      collaborators: collaborators.map((entry) => {
        const collab = entry as Record<string, unknown>;
        return {
          email: (collab.email as string).trim(),
          role: collab.role as "Developer" | "Designer" | "Manager",
        };
      }),
    },
    step3: {
      githubConnected: Boolean(step3?.githubConnected),
      asanaConnected: Boolean(step3?.asanaConnected),
      isGithubDisconnected: Boolean(step3?.isGithubDisconnected),
      isAsanaDisconnected: Boolean(step3?.isAsanaDisconnected),
    },
    step4: {
      milestoneDrafts: milestoneDrafts
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => {
          const draft = entry as Record<string, unknown>;
          return {
            title: typeof draft.title === "string" ? draft.title : "",
            tasks: Array.isArray(draft.tasks)
              ? draft.tasks.filter((t): t is string => typeof t === "string")
              : [],
            isApproved: Boolean(draft.isApproved),
          };
        }),
    },
    workspaceId:
      typeof raw.workspaceId === "string" ? raw.workspaceId : undefined,
    projectId: typeof raw.projectId === "string" ? raw.projectId : undefined,
  };

  return { ok: true, data };
}
