"use client";

import { TaskAiInsight } from "@/components/tasks/task-ai-insight";
import { getColumnAiInsight } from "@/components/tasks/task-ai-insight-utils";
import type { TaskStatus } from "@/components/tasks/task-types";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useMemo } from "react";
import { SortableTaskCard } from "./sortable-task-card";
import type { BoardColumnProps } from "./types";

function columnMinHeight(taskCount: number) {
  const header = 40;
  const addButton = 44;
  const insight = taskCount > 0 ? 72 : 0;
  const perTask = 96;
  const padding = 16;

  return Math.max(
    300,
    header + padding + addButton + insight + taskCount * perTask,
  );
}

export function BoardColumn({
  column,
  tasks,
  taskIds,
  selectedTaskId,
  isBoardDragging = false,
  onSelectTask,
  onUpdateTask,
  onAddTask,
  addTaskStatus,
}: BoardColumnProps & { addTaskStatus: TaskStatus }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const taskMap = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );

  const columnTasks = useMemo(
    () =>
      taskIds
        .map((taskId) => taskMap.get(taskId))
        .filter((task): task is NonNullable<typeof task> => task != null),
    [taskIds, taskMap],
  );

  return (
    <section
      className="flex flex-col rounded-lg border border-border/60 bg-card"
      style={{ minHeight: columnMinHeight(taskIds.length) }}
    >
      <header
        className={cn(
          "px-3 py-2 text-center text-xs font-semibold tracking-tight",
          column.headerClassName,
        )}
      >
        {column.label}
        <span className="ml-1 text-xs font-normal opacity-70">
          ({taskIds.length})
        </span>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 p-2 transition-colors duration-200",
          isOver && "bg-violet-50 dark:bg-violet-500/5",
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {taskIds.map((taskId) => {
            const task = taskMap.get(taskId);
            if (!task) return null;

            return (
              <SortableTaskCard
                key={taskId}
                task={task}
                selected={selectedTaskId === taskId}
                isBoardDragging={isBoardDragging}
                onSelect={onSelectTask}
                onUpdate={onUpdateTask}
              />
            );
          })}
        </SortableContext>

        {!isBoardDragging && columnTasks.length > 0 ? (
          <TaskAiInsight text={getColumnAiInsight(columnTasks, addTaskStatus)} />
        ) : null}

        <button
          type="button"
          onClick={() => onAddTask(addTaskStatus)}
          className="flex w-full shrink-0 items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground"
        >
          <Plus className="size-4" />
          Add task
        </button>
      </div>
    </section>
  );
}
