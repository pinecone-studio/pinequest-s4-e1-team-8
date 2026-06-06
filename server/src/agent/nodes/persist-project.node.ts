import { AIMessage } from "@langchain/core/messages";
import { eq } from "drizzle-orm";
import type { getDrizzleDb } from "../../lib/db/db";
import { projects } from "../../schema/schema";
import type { BriskState } from "../brisk.state";
import type { BriskAgentRuntime } from "../brisk.types";

type DrizzleDb = ReturnType<typeof getDrizzleDb>;

export const createPersistProjectNode =
  (db: DrizzleDb, config: BriskAgentRuntime) =>
  async (state: typeof BriskState.State) => {
    if (!state.isStepValid || !state.breakdown) {
      return {
        isStepValid: false,
        errorCode: "DB_WRITE_FAILED" as const,
        messages: [new AIMessage("Project persist skipped: Invalid state or missing breakdown.")],
      };
    }

    const projectTitle =
      state.breakdown.projectTitle?.trim() || config.projectName?.trim() || "New Project";

    try {
      const [existing] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, state.projectId))
        .limit(1);

      if (!existing) {
        await db.insert(projects).values({
          id: state.projectId,
          workspaceId: config.workspaceId,
          name: projectTitle,
          description: config.projectDescription?.trim() || null,
        });
      }

      return {
        isStepValid: true,
        errorCode: null,
        messages: [new AIMessage(`Project "${projectTitle}" persisted successfully.`)],
      };
    } catch {
      return {
        isStepValid: false,
        errorCode: "DB_WRITE_FAILED" as const,
        messages: [new AIMessage(`Project persist failed: Unable to write "${projectTitle}" to database.`)],
      };
    }
  };
