"use client";

import { TaskTeamCard } from "@/components/tasks/task-team-card";
import { buildTeamSummaries } from "@/components/tasks/task-team-utils";
import type { TaskListItem } from "@/components/tasks/task-types";
import { useMemo } from "react";

type TaskTeamFilterProps = {
  activeTeam: string | null;
  tasks: TaskListItem[];
  onChange: (team: string | null) => void;
};

export function TaskTeamFilter({
  activeTeam,
  tasks,
  onChange,
}: TaskTeamFilterProps) {
  const teams = useMemo(() => buildTeamSummaries(tasks), [tasks]);

  if (teams.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Teams
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,220px))] gap-2.5">
        {teams.map((team) => (
          <TaskTeamCard
            key={team.name}
            team={team}
            active={activeTeam === team.name}
            onClick={() => onChange(activeTeam === team.name ? null : team.name)}
          />
        ))}
      </div>
    </section>
  );
}
