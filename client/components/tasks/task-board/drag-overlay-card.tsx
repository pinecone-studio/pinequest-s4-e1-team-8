"use client";

import { TaskCard } from "@/components/tasks/task-card";
import type { TaskListItem } from "@/components/tasks/task-types";

export function DragOverlayCard({
  task,
  selected,
}: {
  task: TaskListItem;
  selected: boolean;
}) {
  return (
    <div className="cursor-grabbing rotate-[1.5deg] scale-[1.02] shadow-2xl shadow-violet-500/20">
      <TaskCard
        task={task}
        selected={selected}
        onSelect={() => {}}
        onUpdate={() => {}}
      />
    </div>
  );
}
