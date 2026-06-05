import { getTaskTeam, type TaskListItem } from "@/components/tasks/task-types";
import { Code2, LayoutGrid, Palette, PieChart } from "lucide-react";

export type TeamSummary = {
  name: string;
  tool: string;
  members: string[];
  progress: number;
  timeLeft: string;
  doneCount: number;
  blockedCount: number;
};

export const memberColors = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-pink-500",
];

const teamVisuals = [
  {
    match: /backend/i,
    icon: LayoutGrid,
    iconClass: "text-emerald-400",
    bgClass: "bg-emerald-500/15",
  },
  {
    match: /ux|ui|design/i,
    icon: Palette,
    iconClass: "text-sky-400",
    bgClass: "bg-sky-500/15",
  },
  {
    match: /front|frontend/i,
    icon: Code2,
    iconClass: "text-lime-400",
    bgClass: "bg-lime-500/15",
  },
  {
    match: /marketing|ops|qa|product/i,
    icon: PieChart,
    iconClass: "text-orange-400",
    bgClass: "bg-orange-500/15",
  },
] as const;

export function buildTeamSummaries(tasks: TaskListItem[]): TeamSummary[] {
  const grouped = new Map<string, TaskListItem[]>();

  for (const task of tasks) {
    const team = getTaskTeam(task);
    const current = grouped.get(team) ?? [];
    current.push(task);
    grouped.set(team, current);
  }

  return Array.from(grouped.entries()).map(([name, teamTasks]) => {
    const members = [...new Set(teamTasks.flatMap((task) => task.members))];
    const progress = Math.round(
      teamTasks.reduce((sum, task) => sum + task.progress, 0) / teamTasks.length,
    );
    const leadTask =
      teamTasks.find((task) => task.team === name) ?? teamTasks[0];

    return {
      name,
      tool: leadTask.tool,
      members,
      progress,
      timeLeft: leadTask.timeLeft,
      doneCount: teamTasks.reduce((sum, task) => sum + task.doneCount, 0),
      blockedCount: teamTasks.reduce((sum, task) => sum + task.blockedCount, 0),
    };
  });
}

export function getTeamVisual(name: string) {
  return (
    teamVisuals.find((visual) => visual.match.test(name)) ?? {
      icon: LayoutGrid,
      iconClass: "text-violet-400",
      bgClass: "bg-violet-500/15",
    }
  );
}

export function getProgressColor(progress: number) {
  if (progress >= 75) {
    return "bg-emerald-500";
  }

  if (progress >= 50) {
    return "bg-violet-500";
  }

  return "bg-amber-500";
}
