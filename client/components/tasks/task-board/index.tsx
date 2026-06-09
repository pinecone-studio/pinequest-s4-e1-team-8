"use client";

import { getTaskBoardColumnKey } from "@/components/tasks/task-types";
import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import { useMemo } from "react";
import { BoardColumn } from "./board-column";
import { DragOverlayCard } from "./drag-overlay-card";
import type { TaskBoardProps } from "./types";
import { useTaskBoardDnd } from "./use-task-board-dnd";
import { defaultBoardColumns, mapBoardColumnToTaskStatus } from "./utils";

export function TaskBoard({
  tasks,
  selectedTaskId,
  onSelectTask,
  onAddTask,
  onUpdateTask,
  columns,
  getTaskColumnKey,
}: TaskBoardProps) {
  const useGithubColumns = Boolean(columns?.length);
  const boardColumns = columns?.length ? columns : defaultBoardColumns;
  const resolveColumnKey = useMemo(
    () =>
      getTaskColumnKey ??
      ((task: (typeof tasks)[number]) =>
        getTaskBoardColumnKey(task, useGithubColumns)),
    [getTaskColumnKey, tasks, useGithubColumns],
  );

  const {
    activeId,
    activeTask,
    handleDragCancel,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
    items,
    sensors,
  } = useTaskBoardDnd(tasks, onUpdateTask, {
    columns: boardColumns,
    getTaskColumnKey: resolveColumnKey,
    useBoardColumnUpdates: useGithubColumns,
  });

  const isBoardDragging = activeId !== null;
  const gridClassName =
    boardColumns.length <= 3
      ? "grid w-full grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3"
      : "grid w-full grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={gridClassName}>
        {boardColumns.map((column) => (
          <BoardColumn
            key={column.id}
            column={column}
            tasks={tasks}
            taskIds={items[column.id] ?? []}
            selectedTaskId={selectedTaskId}
            isBoardDragging={isBoardDragging}
            onSelectTask={onSelectTask}
            onUpdateTask={onUpdateTask}
            onAddTask={(status) => onAddTask(status)}
            addTaskStatus={mapBoardColumnToTaskStatus(column.id)}
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
