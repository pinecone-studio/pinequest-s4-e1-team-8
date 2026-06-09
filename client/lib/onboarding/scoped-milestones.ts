import type { ScopedMilestone } from "@/components/onboarding/onboarding-types";
import type { ApiTaskRecord } from "@/lib/api/tasks";

export type ProjectMilestone = ApiTaskRecord & {
  subtaskCount: number;
};

export function mapScopedMilestonesToProjectMilestones(
  drafts: ScopedMilestone[],
  projectId: string,
): ProjectMilestone[] {
  return drafts
    .filter((draft) => draft.title.trim())
    .map((draft, index) => {
      const tasks = draft.tasks.filter((task) => task.trim());

      return {
        id: `scoped-milestone-${index}`,
        source: "internal",
        projectId,
        parentId: null,
        title: draft.title.trim(),
        description: null,
        tool: "Brisk Onboarding",
        status: draft.isApproved ? "TODO" : "BACKLOG",
        priority: "MEDIUM",
        blocked: false,
        dueDate: "",
        progress: 0,
        timeLeft: "",
        doneCount: 0,
        blockedCount: 0,
        members: [],
        subtaskCount: tasks.length,
      };
    });
}
