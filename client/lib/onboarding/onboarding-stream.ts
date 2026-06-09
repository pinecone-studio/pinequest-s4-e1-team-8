import { getAgentStreamRunUrl } from "@/lib/api/agent-stream-url";
import { buildBackendAuthHeaders } from "@/lib/api/backend-auth";

const ONBOARDING_WORKER_NODE = "onboarding_worker";

type AgentStreamMessage = {
  type: string;
  content: unknown;
};

type AgentStreamNodeUpdate = {
  messages?: AgentStreamMessage[];
};

type AgentStreamNodeEventData = {
  node: string;
  update?: AgentStreamNodeUpdate;
};

type ParsedSSEEvent = {
  event: string;
  data: string;
};

export type OnboardingStreamHandlers = {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
};

function extractTextFromContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part === "object" && "text" in part) {
          const text = (part as { text: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .join("");
  }

  return "";
}

function parseSSEEvent(rawEvent: string): ParsedSSEEvent {
  let event = "message";
  const dataLines: string[] = [];

  for (const line of rawEvent.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }

  return { event, data: dataLines.join("\n") };
}

function handleNodeEvent(data: string, onChunk: (text: string) => void) {
  let parsed: AgentStreamNodeEventData;

  try {
    parsed = JSON.parse(data) as AgentStreamNodeEventData;
  } catch {
    return;
  }

  if (parsed.node !== ONBOARDING_WORKER_NODE) {
    return;
  }

  const text = (parsed.update?.messages ?? [])
    .map((message) => extractTextFromContent(message.content))
    .join("");

  if (text.length > 0) {
    onChunk(text);
  }
}

export async function streamOnboardingWorker(
  prompt: string,
  getToken: () => Promise<string | null>,
  handlers: OnboardingStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const headers = await buildBackendAuthHeaders(getToken);

  let response: Response;
  try {
    response = await fetch(getAgentStreamRunUrl(), {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ prompt }),
      signal,
    });
  } catch (error) {
    const message =
      error instanceof TypeError
        ? "Could not reach the API server. Run `bun run dev` in the server folder on port 8787."
        : error instanceof Error
          ? error.message
          : "Onboarding stream failed to connect.";
    handlers.onError(message);
    return;
  }

  if (!response.ok || !response.body) {
    handlers.onError(`Onboarding stream failed with status ${response.status}.`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let doneCalled = false;

  const finish = () => {
    if (doneCalled) {
      return;
    }
    doneCalled = true;
    handlers.onDone();
  };

  readLoop: while (true) {
    const result = await reader.read();

    if (result.done) {
      break;
    }

    buffer += decoder.decode(result.value, { stream: true });
    const segments = buffer.split("\n\n");
    buffer = segments.pop() ?? "";

    for (const segment of segments) {
      const trimmed = segment.trim();
      if (trimmed.length === 0) {
        continue;
      }

      const { event, data } = parseSSEEvent(trimmed);

      if (event === "node") {
        handleNodeEvent(data, handlers.onChunk);
      } else if (event === "done") {
        await reader.cancel();
        finish();
        break readLoop;
      }
    }
  }

  finish();
}
