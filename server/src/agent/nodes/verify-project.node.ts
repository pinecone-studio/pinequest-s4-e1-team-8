import { AIMessage } from "@langchain/core/messages";
import { eq } from "drizzle-orm";
import type { getDrizzleDb } from "../../lib/db/db";
import { projects, workspaces } from "../../schema/schema";
import type { BriskState } from "../brisk.state";
import type { BriskAgentRuntime } from "../brisk.types";

type DrizzleDb = ReturnType<typeof getDrizzleDb>;

export const createVerifyProjectNode =
  (db: DrizzleDb, config: BriskAgentRuntime) =>
  async (state: typeof BriskState.State) => {
    if (!state.projectId.trim()) {
      return {
        isStepValid: false,
        messages: [new AIMessage("Verification failed: Active project context missing.")],
      };
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, state.projectId))
      .limit(1);

    if (project) {
      return {
        isStepValid: true,
        messages: [new AIMessage("Project framework verified successfully.")],
      };
    }

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, config.workspaceId))
      .limit(1);

    if (!workspace) {
      return {
        isStepValid: false,
        messages: [new AIMessage("Verification failed: Target workspace context missing.")],
      };
    }

    return {
      isStepValid: true,
      messages: [new AIMessage("Project context verified and ready for provisioning.")],
    };
  };
