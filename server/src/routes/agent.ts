import type { BaseMessage } from "@langchain/core/messages";
import { HumanMessage } from "@langchain/core/messages";
import { END } from "@langchain/langgraph";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { compileSupervisorGraph } from "../agent/graph";
import type { SupervisorContext } from "../agent/state";
import type { Bindings } from "../lib/common/types";

const agentRoutes = new Hono<{ Bindings: Bindings }>();

type StreamNodeUpdate = {
  messages?: BaseMessage[];
  context?: SupervisorContext;
  nextElement?: string;
};

function extractPrompt(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const prompt = (raw as Record<string, unknown>).prompt;
  if (typeof prompt !== "string") {
    return null;
  }

  const trimmed = prompt.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function serializeUpdate(update: StreamNodeUpdate) {
  return {
    ...update,
    messages: update.messages?.map((message) => ({
      type: message._getType(),
      content: message.content,
    })),
  };
}

agentRoutes.post("/run", async (c) => {
  const raw = await c.req.json().catch(() => null);
  const prompt = extractPrompt(raw);

  if (!prompt) {
    return c.json({ error: "prompt is required" }, 400);
  }

  const graph = compileSupervisorGraph();

  return streamSSE(c, async (stream) => {
    const events = await graph.stream(
      { messages: [new HumanMessage(prompt)] },
      { streamMode: "updates", signal: c.req.raw.signal },
    );

    for await (const chunk of events) {
      if (stream.aborted) {
        return;
      }

      for (const [nodeName, update] of Object.entries(chunk as Record<string, StreamNodeUpdate>)) {
        if (nodeName === END) {
          await stream.writeSSE({ event: "done", data: JSON.stringify({ node: nodeName }) });
          return;
        }

        await stream.writeSSE({
          event: "node",
          data: JSON.stringify({ node: nodeName, update: serializeUpdate(update) }),
        });
      }
    }

    if (!stream.aborted) {
      await stream.writeSSE({ event: "done", data: JSON.stringify({ node: END }) });
    }
  });
});

export default agentRoutes;
