import { buildBackendAuthHeaders } from "@/lib/api/backend-auth";

export type ScopingChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ScopingMilestoneResult = {
  title: string;
  tasks: string[];
};

export type ScopingClarificationResult = {
  isClarification: true;
  message: string;
  suggestions: string[];
};

export type ScopingFinalResult = {
  isClarification: false;
  message: string;
  milestones: ScopingMilestoneResult[];
};

export type ScopingResult = ScopingClarificationResult | ScopingFinalResult;

export type ScopingTurnParams = {
  projectName: string;
  description: string;
  messages: ScopingChatMessage[];
  tddContext?: string;
};

function getScopingTurnUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/backend/onboarding/scoping";
  }
  const base =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_SERVER_URL ??
    "http://localhost:8787";
  return `${base.replace(/\/$/, "")}/api/onboarding/scoping`;
}

export async function requestScopingTurn(
  params: ScopingTurnParams,
  getToken: () => Promise<string | null>,
  signal?: AbortSignal,
): Promise<ScopingResult> {
  const headers = await buildBackendAuthHeaders(getToken);

  const response = await fetch(getScopingTurnUrl(), {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(params),
    signal,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Scoping request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return data as ScopingResult;
}
