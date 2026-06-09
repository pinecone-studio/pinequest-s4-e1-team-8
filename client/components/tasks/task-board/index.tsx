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
    activeId,
    activeTask,
    handleDragCancel,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
    items,
    sensors,
  } = useTaskBoardDnd(tasks, onUpdateTask);

  const isBoardDragging = activeId !== null;

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
            isBoardDragging={isBoardDragging}
            onSelectTask={onSelectTask}
            onUpdateTask={onUpdateTask}
            onAddTask={onAddTask}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
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
