import { and, eq, ne } from "drizzle-orm";
import type { useDB } from "../db/db";
import { subTeamMembers, subTeams, tasks, users } from "../../schema/schema";
import type {
  CapacityRiskMember,
  OpenBlocker,
  PastDueMilestone,
  ProjectRiskMetrics,
} from "./risk-analysis.types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDueDate(value: string | null): Date | null {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysOverdue(dueDate: Date, now: Date): number {
  return Math.max(0, Math.ceil((now.getTime() - dueDate.getTime()) / MS_PER_DAY));
}

export async function gatherProjectRiskMetrics(
  db: ReturnType<typeof useDB>,
  projectId: string,
  workspaceId: string,
  now = new Date(),
): Promise<ProjectRiskMetrics> {
  const teamMembers = await db
    .select({
      userId: users.id,
      name: users.name,
      subTeamId: subTeams.id,
      subTeamName: subTeams.name,
    })
    .from(subTeamMembers)
    .innerJoin(subTeams, eq(subTeamMembers.subTeamId, subTeams.id))
    .innerJoin(users, eq(subTeamMembers.userId, users.id))
    .where(eq(subTeams.projectId, projectId));

  const activeTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), ne(tasks.status, "DONE")));

  const assignedMemberIds = new Set(
    activeTasks.flatMap((task) => (task.assigneeId ? [task.assigneeId] : [])),
  );

  const capacityRisks: CapacityRiskMember[] = teamMembers
    .filter((member) => !assignedMemberIds.has(member.userId))
    .map((member) => ({
      userId: member.userId,
      name: member.name,
      subTeamId: member.subTeamId,
      subTeamName: member.subTeamName,
    }));

  const pastDueMilestones: PastDueMilestone[] = activeTasks.flatMap((task) => {
    if (task.parentId !== null) return [];
    const dueDate = parseDueDate(task.dueDate);
    if (!dueDate || dueDate.getTime() >= now.getTime()) return [];

    return [
      {
        taskId: task.id,
        title: task.title,
        dueDate: dueDate.toISOString().slice(0, 10),
        daysOverdue: daysOverdue(dueDate, now),
      },
    ];
  });

  const openBlockers: OpenBlocker[] = activeTasks
    .filter((task) => task.blocked)
    .map((task) => ({
      taskId: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
    }));

  return {
    projectId,
    workspaceId,
    activeMemberCount: teamMembers.length,
    capacityRisks,
    pastDueMilestones,
    openBlockers,
  };
}
