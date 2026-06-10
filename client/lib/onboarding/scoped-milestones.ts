import type { ScopedMilestone } from "@/components/onboarding/onboarding-types";
import type { ApiTaskRecord } from "@/lib/api/tasks";
import type { MilestoneDraft } from "@/lib/onboarding/parse-milestone-drafts";

export type ProjectMilestone = ApiTaskRecord & {
  subtaskCount: number;
};

export function milestoneDraftsToScoped(
  drafts: MilestoneDraft[],
): ScopedMilestone[] {
  return drafts
    .filter((draft) => draft.title.trim())
    .map((draft) => ({
      title: draft.title.trim(),
      tasks: draft.tasks.filter((task) => task.trim()),
      isApproved: draft.isApproved,
    }));
}

export function resolveScopedMilestones(
  scoped?: ScopedMilestone[],
): ScopedMilestone[] {
  return scoped?.length ? scoped : [];
}

export function mapScopedMilestonesToProjectMilestones(
  drafts: ScopedMilestone[],
  projectId: string,
): ProjectMilestone[] {
  return drafts.map((draft, index) => ({
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
    subtaskCount: draft.tasks.length,
  }));
}
