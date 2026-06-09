"use client";

import { TaskCard } from "@/components/tasks/task-card";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { SortableTaskCardProps } from "./types";

export function SortableTaskCard({
  task,
  selected,
  isBoardDragging = false,
  onSelect,
  onUpdate,
}: SortableTaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);

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
    disabled: isEditing,
    animateLayoutChanges: () => false,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging || isBoardDragging ? undefined : transition,
        opacity: isDragging ? 0 : 1,
      }}
      className="touch-none"
      {...attributes}
      {...(isEditing ? {} : listeners)}
    >
      <TaskCard
        task={task}
        selected={selected}
        onSelect={onSelect}
        onUpdate={onUpdate}
        onEditingChange={setIsEditing}
      />
    </div>
  );
}
