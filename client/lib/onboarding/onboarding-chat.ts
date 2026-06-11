import { buildBackendAuthHeaders } from "@/lib/api/backend-auth";
import {
  RUBRIC_CATEGORIES,
  type DiscoveryQuestion,
  type OnboardingSessionRecord,
  type OnboardingTranscriptMessage,
  type RubricCategory,
  type TddLayoutState,
  type TddPlanningBrief,
} from "@/lib/onboarding/tdd-types";

export type OnboardingChatParams = {
  sessionId?: string;
  projectName: string;
  description: string;
  message: string;
};

export type OnboardingChatStreamEvent =
  | { type: "session"; sessionId: string }
  | { type: "token"; token: string }
  | {
      type: "complete";
      message: string;
      round: number;
      questions: DiscoveryQuestion[];
      coverage: number;
    }
  | { type: "synthesizing"; status: string }
  | { type: "synthesis"; tddLayoutState: TddLayoutState; brief: TddPlanningBrief; status: string }
  | { type: "done"; ok: boolean }
  | { type: "error"; error: string };

function getChatUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/backend/onboarding/chat";
  }
  const base =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_SERVER_URL ??
    "http://localhost:8787";
  return `${base.replace(/\/$/, "")}/api/onboarding/chat`;
}

function getSessionsBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/backend/onboarding/sessions";
  }
  const base =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_SERVER_URL ??
    "http://localhost:8787";
  return `${base.replace(/\/$/, "")}/api/onboarding/sessions`;
}

function normalizeDiscoveryQuestions(value: unknown): DiscoveryQuestion[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item): DiscoveryQuestion | null => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : "";
      const category = typeof record.category === "string" ? record.category : "";
      const topic = typeof record.topic === "string" ? record.topic : "";
      const prompt = typeof record.prompt === "string" ? record.prompt : "";
      if (!id || !topic || !prompt || !RUBRIC_CATEGORIES.includes(category as RubricCategory)) {
        return null;
      }
      const examples = Array.isArray(record.examples)
        ? record.examples.filter((example): example is string => typeof example === "string")
        : undefined;
      return { id, category: category as RubricCategory, topic, prompt, examples };
    })
    .filter((item): item is DiscoveryQuestion => item !== null);
}

function parseSseBlock(block: string): OnboardingChatStreamEvent | null {
  const lines = block.split("\n");
  let eventName = "message";
  let data = "";

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      data += line.slice(5).trim();
    }
  }

  if (!data) {
    return null;
  }

  try {
    const parsed = JSON.parse(data) as Record<string, unknown>;
    switch (eventName) {
      case "session":
        return {
          type: "session",
          sessionId: String(parsed.sessionId ?? ""),
        };
      case "token":
        return { type: "token", token: String(parsed.token ?? "") };
      case "complete":
        return {
          type: "complete",
          message: String(parsed.message ?? ""),
          round: typeof parsed.round === "number" ? parsed.round : 1,
          questions: normalizeDiscoveryQuestions(parsed.questions),
          coverage: typeof parsed.coverage === "number" ? parsed.coverage : 0,
        };
      case "synthesizing":
        return { type: "synthesizing", status: String(parsed.status ?? "") };
      case "synthesis":
        return {
          type: "synthesis",
          tddLayoutState: parsed.tddLayoutState as TddLayoutState,
          brief: parsed.brief as TddPlanningBrief,
          status: String(parsed.status ?? ""),
        };
      case "done":
        return { type: "done", ok: parsed.ok === true };
      case "error":
        return { type: "error", error: String(parsed.error ?? "Stream error") };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export async function streamOnboardingChat(
  params: OnboardingChatParams,
  getToken: () => Promise<string | null>,
  onEvent: (event: OnboardingChatStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const headers = await buildBackendAuthHeaders(getToken, { Accept: "text/event-stream" });

  const response = await fetch(getChatUrl(), {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(params),
    signal,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message =
      data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Chat request failed with status ${response.status}.`;
    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("Chat stream body is empty.");
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
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const event = parseSseBlock(block.trim());
      if (event) {
        onEvent(event);
      }
    }
  }

  if (buffer.trim()) {
    const event = parseSseBlock(buffer.trim());
    if (event) {
      onEvent(event);
    }
  }
}

export type RefineSelectionParams = {
  blockTitle: string;
  paragraphContext: string;
  selectedText: string;
  instruction: string;
};

export async function requestRefineSelection(
  params: RefineSelectionParams,
  getToken: () => Promise<string | null>,
  signal?: AbortSignal,
): Promise<{ refinedText: string }> {
  const headers = await buildBackendAuthHeaders(getToken);

  const base =
    typeof window !== "undefined"
      ? "/api/backend/onboarding/refine-selection"
      : `${(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787").replace(/\/$/, "")}/api/onboarding/refine-selection`;

  const response = await fetch(base, {
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
        : `Refinement failed with status ${response.status}.`;
    throw new Error(message);
  }

  return data as { refinedText: string };
}

export async function getOnboardingSession(
  sessionId: string,
  getToken: () => Promise<string | null>,
): Promise<OnboardingSessionRecord> {
  const headers = await buildBackendAuthHeaders(getToken);
  const response = await fetch(`${getSessionsBaseUrl()}/${sessionId}`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Session lookup failed with status ${response.status}.`;
    throw new Error(message);
  }

  return data as OnboardingSessionRecord;
}

export async function patchOnboardingSession(
  sessionId: string,
  payload: {
    tddLayoutState?: TddLayoutState;
    status?: OnboardingSessionRecord["status"];
    docUrl?: string;
  },
  getToken: () => Promise<string | null>,
): Promise<void> {
  const headers = await buildBackendAuthHeaders(getToken);
  const response = await fetch(`${getSessionsBaseUrl()}/${sessionId}`, {
    method: "PATCH",
    headers,
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message =
      data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Session update failed with status ${response.status}.`;
    throw new Error(message);
  }
}

export async function exportGoogleDoc(params: {
  sessionId: string;
  projectName: string;
  tddLayoutState: TddLayoutState;
}): Promise<{ docUrl: string }> {
  const response = await fetch("/api/onboarding/export-google-doc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Export failed with status ${response.status}.`;
    throw new Error(message);
  }

  return data as { docUrl: string };
}

export type { OnboardingTranscriptMessage };
