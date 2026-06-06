import { AIMessage } from "@langchain/core/messages";
import { nanoid } from "nanoid";
import type { getDrizzleDb } from "../../lib/db/db";
import { tasks } from "../../schema/schema";
import type { BriskState } from "../brisk.state";
import type { BriskAgentRuntime } from "../brisk.types";

type DrizzleDb = ReturnType<typeof getDrizzleDb>;

export const createPersistTasksNode =
  (db: DrizzleDb, config: BriskAgentRuntime) =>
  async (state: typeof BriskState.State) => {
    if (!state.isStepValid || !state.breakdown) {
      return {
        isStepValid: false,
        errorCode: "DB_WRITE_FAILED" as const,
        messages: [new AIMessage("Task persist skipped: Invalid state or missing breakdown.")],
      };
    }

    try {
      let tasksCreated = 0;

      for (const phase of state.breakdown.phases) {
        const phaseTaskId = `internal-${nanoid(10)}`;

        await db.insert(tasks).values({
          id: phaseTaskId,
          workspaceId: config.workspaceId,
          projectId: state.projectId,
          title: phase.name.trim(),
          description: phase.description?.trim() || null,
          status: "TODO",
          priority: "HIGH",
          source: "internal",
          tool: "Brisk AI",
        });

        tasksCreated += 1;

        for (const task of phase.tasks) {
          await db.insert(tasks).values({
            id: `internal-${nanoid(10)}`,
            workspaceId: config.workspaceId,
            projectId: state.projectId,
            parentId: phaseTaskId,
            title: task.title.trim(),
            description: task.description?.trim() || null,
            status: task.status ?? "BACKLOG",
            priority: task.priority ?? "MEDIUM",
            source: "internal",
            tool: "Brisk AI",
          });

          tasksCreated += 1;
        }
      }

      const projectTitle =
        state.breakdown.projectTitle?.trim() || config.projectName?.trim() || "New Project";

      return {
        isStepValid: true,
        errorCode: null,
        messages: [
          new AIMessage(
            `Persisted project "${projectTitle}" with ${state.breakdown.phases.length} milestones and ${tasksCreated} total records.`,
          ),
        ],
      };
    } catch {
      return {
        isStepValid: false,
        errorCode: "DB_WRITE_FAILED" as const,
        messages: [new AIMessage("Task persist failed: Unable to write task records to database.")],
      };
    }
  };
