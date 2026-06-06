import { nanoid } from "nanoid";
import type { getDrizzleDb } from "../../lib/db/db";
import { aiConversations, aiMessages } from "../../schema/schema";
import type { BriskState } from "../brisk.state";
import type { BriskAgentRuntime } from "../brisk.types";

type DrizzleDb = ReturnType<typeof getDrizzleDb>;

const SENDER_MAP = {
  human: "USER",
  ai: "AI",
  system: "SYSTEM",
} as const;

type KnownMessageType = keyof typeof SENDER_MAP;

export const createLogExecutionNode =
  (db: DrizzleDb, config: BriskAgentRuntime) =>
  async (state: typeof BriskState.State) => {
    if (!config.userId) {
      return {};
    }

    const conversationId = nanoid();
    const title =
      state.breakdown?.projectTitle?.trim() || config.projectName?.trim() || "Agent Run";

    await db.insert(aiConversations).values({
      id: conversationId,
      workspaceId: config.workspaceId,
      userId: config.userId,
      title,
    });

    for (const message of state.messages) {
      const messageType = message._getType() as KnownMessageType;
      const sender = SENDER_MAP[messageType] ?? "AI";

      await db.insert(aiMessages).values({
        id: nanoid(),
        conversationId,
        sender,
        content:
          typeof message.content === "string"
            ? message.content
            : JSON.stringify(message.content),
      });
    }

    return {};
  };
