"use client";

import { taskStatuses } from "@/components/tasks/task-types";
import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import { BoardColumn } from "./board-column";
import { DragOverlayCard } from "./drag-overlay-card";
import type { TaskBoardProps } from "./types";
import { useTaskBoardDnd } from "./use-task-board-dnd";

export function TaskBoard({
  tasks,
  selectedTaskId,
  onSelectTask,
  onAddTask,
  onUpdateTask,
}: TaskBoardProps) {
  const {
    activeTask,
    handleDragCancel,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
    items,
    sensors,
  } = useTaskBoardDnd(tasks, onUpdateTask);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {taskStatuses.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={tasks}
            taskIds={items[status]}
            selectedTaskId={selectedTaskId}
            onSelectTask={onSelectTask}
            onUpdateTask={onUpdateTask}
            onAddTask={onAddTask}
          />
        ))}
      </div>

      <DragOverlay
        dropAnimation={{
          duration: 250,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        }}
      >
        {activeTask ? (
          <DragOverlayCard
            task={activeTask}
            selected={selectedTaskId === activeTask.id}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
