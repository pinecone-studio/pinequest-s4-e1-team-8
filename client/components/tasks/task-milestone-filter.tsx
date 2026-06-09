"use client";

import { TaskTeamCard } from "@/components/tasks/task-team-card";
import {
  buildMilestoneSummaries,
  partitionSourceTasks,
} from "@/components/tasks/task-milestone-utils";
import type { TaskListItem } from "@/components/tasks/task-types";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

type TaskMilestoneFilterProps = {
  activeMilestoneId: string | null | undefined;
  tasks: TaskListItem[];
  onChange: (milestoneId: string | null | undefined) => void;
};

export function TaskMilestoneFilter({
  activeMilestoneId,
  tasks,
  onChange,
}: TaskMilestoneFilterProps) {
  const items = useMemo(() => {
    const { milestones, boardTasks } = partitionSourceTasks(tasks);
    return buildMilestoneSummaries(milestones, boardTasks);
  }, [tasks]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Milestones
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,220px))] gap-2.5">
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className={cn(
            "w-full max-w-[220px] rounded-lg border px-3 py-2 text-left text-xs transition-colors",
            activeMilestoneId === undefined
              ? "border-violet-500 border-dashed bg-card text-foreground ring-1 ring-violet-500/40"
              : "border-dashed border-border/70 bg-card/40 text-muted-foreground hover:border-violet-400/40 hover:text-foreground",
          )}
        >
          All tasks
          <span className="mt-0.5 block text-[10px] text-muted-foreground/80">
            Show every task
          </span>
        </button>
        {items.map((milestone) => {
          const key = milestone.id ?? "__unassigned__";
          const isActive =
            milestone.id === null
              ? activeMilestoneId === null
              : activeMilestoneId === milestone.id;

          return (
            <TaskTeamCard
              key={key}
              team={milestone}
              active={isActive}
              onClick={() =>
                onChange(isActive ? undefined : milestone.id)
              }
            />
          );
        })}
      </div>
    </section>
  );
}
