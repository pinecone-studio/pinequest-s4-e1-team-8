"use client";

import { buildTeamSummaries } from "@/components/tasks/task-team-utils";
import type { TaskListItem } from "@/components/tasks/task-types";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { useMemo } from "react";

type AnalyticsTeamSelectProps = {
  activeTeam: string | null;
  tasks: TaskListItem[];
  onChange: (team: string | null) => void;
  className?: string;
};

export function AnalyticsTeamSelect({
  activeTeam,
  tasks,
  onChange,
  className,
}: AnalyticsTeamSelectProps) {
  const teams = useMemo(() => buildTeamSummaries(tasks), [tasks]);

  if (teams.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Users className="size-3.5 text-violet-700 dark:text-violet-400/70" />
        <p className="text-xs font-medium text-muted-foreground">Team</p>
      </div>

      <select
        value={activeTeam ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        className="min-w-[200px] rounded-md border border-border/60 bg-secondary px-3 py-1.5 text-sm text-foreground/90 outline-none focus:border-violet-500/40"
      >
        <option value="">All teams</option>
        {teams.map((team) => (
          <option key={team.name} value={team.name}>
            {team.name}
          </option>
        ))}
      </select>
    </div>
  );
}
