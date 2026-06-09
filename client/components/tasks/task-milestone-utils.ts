import type { TaskListItem } from "@/components/tasks/task-types";
import { isMilestoneTask } from "@/components/tasks/task-types";
import type { TeamSummary } from "@/components/tasks/task-team-utils";
import { normalizeMemberInitials } from "@/lib/tasks/map-api-task";

export type MilestoneSummary = TeamSummary & {
  id: string | null;
  taskCount: number;
};

export function isMilestoneParentTask(
  task: Pick<TaskListItem, "id" | "parentId" | "tool">,
  allTasks: TaskListItem[],
): boolean {
  if (isMilestoneTask(task)) {
    return true;
  }

  if (task.parentId) {
    return false;
  }

  return allTasks.some((entry) => entry.parentId === task.id);
}

export function partitionSourceTasks(tasks: TaskListItem[] | null | undefined) {
  const milestones: TaskListItem[] = [];
  const boardTasks: TaskListItem[] = [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  for (const task of safeTasks) {
    if (isMilestoneParentTask(task, safeTasks)) {
      milestones.push(task);
      continue;
    }

    boardTasks.push(task);
  }

  return { milestones, boardTasks };
}

export function buildMilestoneSummaries(
  milestones: TaskListItem[],
  boardTasks: TaskListItem[],
): MilestoneSummary[] {
  const summaries: MilestoneSummary[] = milestones.map((milestone) => {
    const children = boardTasks.filter((task) => task.parentId === milestone.id);
    const members = [
      ...new Set(
        [
          ...normalizeMemberInitials(milestone.members as unknown[]),
          ...children.flatMap((task) =>
            normalizeMemberInitials(task.members as unknown[]),
          ),
        ],
      ),
    ];

    const progress =
      milestone.tool === "Milestone"
        ? milestone.progress
        : children.length > 0
          ? Math.round(
              children.reduce((sum, task) => sum + task.progress, 0) /
                children.length,
            )
          : milestone.progress;

    const doneCount =
      milestone.tool === "Milestone"
        ? milestone.doneCount
        : children.filter((task) => task.status === "done").length;

    return {
      id: milestone.id,
      name: milestone.title,
      tool: milestone.tool || "Milestone",
      members,
      progress,
      timeLeft: milestone.timeLeft || milestone.dueDate || "Open",
      doneCount,
      blockedCount:
        children.filter((task) => task.blocked).length +
        (milestone.blocked ? 1 : 0),
      taskCount: children.length,
    };
  });

  const unassigned = boardTasks.filter((task) => !task.parentId);
  if (unassigned.length > 0) {
    summaries.push({
      id: null,
      name: "No milestone",
      tool: "Unassigned",
      members: [
        ...new Set(
          unassigned.flatMap((task) =>
            normalizeMemberInitials(task.members as unknown[]),
          ),
        ),
      ],
      progress: Math.round(
        unassigned.reduce((sum, task) => sum + task.progress, 0) /
          unassigned.length,
      ),
      timeLeft: "Unassigned",
      doneCount: unassigned.filter((task) => task.status === "done").length,
      blockedCount: unassigned.filter((task) => task.blocked).length,
      taskCount: unassigned.length,
    });
  }

  return summaries;
}

export function filterTasksByMilestone(
  boardTasks: TaskListItem[],
  activeMilestoneId: string | null | undefined,
): TaskListItem[] {
  if (activeMilestoneId === undefined) {
    return boardTasks;
  }

  if (activeMilestoneId === null) {
    return boardTasks.filter((task) => !task.parentId);
  }

  return boardTasks.filter((task) => task.parentId === activeMilestoneId);
}
