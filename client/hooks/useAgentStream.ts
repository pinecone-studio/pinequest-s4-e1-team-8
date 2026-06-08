"use client";

import { buildBackendAuthHeaders } from "@/lib/api/backend-auth";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";

const getServerBaseUrl = () =>
  (process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:8787").replace(/\/$/, "");

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

export function useAgentStream() {
  const { getToken } = useAuth();
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [nodeOutputs, setNodeOutputs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  const handleNodeEvent = useCallback((data: string) => {
    let parsed: AgentStreamNodeEventData;

    try {
      parsed = JSON.parse(data) as AgentStreamNodeEventData;
    } catch {
      return;
    }

    const { node, update } = parsed;
    setActiveNode(node);

    const text = (update?.messages ?? [])
      .map((message) => extractTextFromContent(message.content))
      .join("");

    if (text.length === 0) {
      return;
    }

    setNodeOutputs((previous) => ({
      ...previous,
      [node]: (previous[node] ?? "") + text,
    }));
  }, []);

  const stream = useCallback(
    async (prompt: string) => {
      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setActiveNode(null);
      setNodeOutputs({});
      setIsComplete(false);
      setIsLoading(true);

      try {
        const headers = await buildBackendAuthHeaders(getToken);
        const response = await fetch(`${getServerBaseUrl()}/api/agent/stream/run`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({ prompt }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Agent stream request failed with status ${response.status}.`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

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
              handleNodeEvent(data);
            } else if (event === "done") {
              await reader.cancel();
              break readLoop;
            }
          }
        }

        setIsComplete(true);
      } catch (error) {
        if (!(error instanceof Error) || error.name !== "AbortError") {
          throw error;
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [getToken, handleNodeEvent],
  );

  return { stream, activeNode, nodeOutputs, isLoading, isComplete, abort };
}
