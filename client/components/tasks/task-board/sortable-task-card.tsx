"use client";

import { TaskCard } from "@/components/tasks/task-card";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SortableTaskCardProps } from "./types";

export function SortableTaskCard({
  task,
  selected,
  onSelect,
  onUpdate,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", status: task.status },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn("touch-none", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={task}
        selected={selected}
        onSelect={onSelect}
        onUpdate={onUpdate}
      />
    </div>
  );
}
