"use client";

import { TaskAiInsight } from "@/components/tasks/task-ai-insight";
import { getColumnAiInsight } from "@/components/tasks/task-ai-insight-utils";
import { taskColumnConfig } from "@/components/tasks/task-types";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useMemo } from "react";
import { SortableTaskCard } from "./sortable-task-card";
import type { BoardColumnProps } from "./types";

export function BoardColumn({
  status,
  tasks,
  taskIds,
  selectedTaskId,
  isBoardDragging = false,
  onSelectTask,
  onUpdateTask,
  onAddTask,
}: BoardColumnProps) {
  const column = taskColumnConfig[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

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
    <section className="flex min-h-[28rem] flex-col overflow-hidden rounded-lg border border-border/60 bg-[#18191d]">
      <header
        className={cn(
          "px-4 py-3 text-center text-sm font-semibold tracking-tight",
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
          "flex min-h-[12rem] flex-1 flex-col gap-3 p-3 transition-colors duration-200",
          isOver && "bg-violet-500/5",
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
          <TaskAiInsight text={getColumnAiInsight(columnTasks, status)} />
        ) : null}

        <button
          type="button"
          onClick={() => onAddTask(status)}
          className="mt-auto flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground"
        >
          <Plus className="size-4" />
          Add task
        </button>
      </div>
    </section>
  );
}
