import { TaskCard } from "@/components/tasks/task-card";
import { TaskAiInsight } from "@/components/tasks/task-ai-insight";
import { getColumnAiInsight } from "@/components/tasks/task-ai-insight-utils";
import {
  taskColumnConfig,
  taskStatuses,
  type TaskListItem,
  type TaskStatus,
  type TaskUpdate,
} from "@/components/tasks/task-types";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Fragment } from "react";

type TaskBoardProps = {
  tasks: TaskListItem[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onAddTask: (status: TaskStatus) => void;
  onUpdateTask: (taskId: string, update: TaskUpdate) => void;
};

export function TaskBoard({
  tasks,
  selectedTaskId,
  onSelectTask,
  onAddTask,
  onUpdateTask,
}: TaskBoardProps) {
  const tasksByStatus = taskStatuses.reduce(
    (groups, status) => {
      groups[status] = tasks.filter((task) => task.status === status);
      return groups;
    },
    {} as Record<TaskStatus, TaskListItem[]>,
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {taskStatuses.map((status) => {
        const column = taskColumnConfig[status];
        const columnTasks = tasksByStatus[status];

        return (
          <section
            key={status}
            className="flex min-h-[28rem] flex-col overflow-hidden rounded-lg border border-border/60 bg-[#18191d]"
          >
            <header
              className={cn(
                "px-4 py-3 text-center text-sm font-semibold tracking-tight",
                column.headerClassName,
              )}
            >
              {column.label}
              <span className="ml-1 text-xs font-normal opacity-70">
                ({columnTasks.length})
              </span>
            </header>
            <div className="flex flex-1 flex-col gap-3 p-3">
              {columnTasks.map((task, index) => (
                <Fragment key={task.id}>
                  <TaskCard
                    task={task}
                    selected={selectedTaskId === task.id}
                    onSelect={onSelectTask}
                    onUpdate={onUpdateTask}
                  />
                  {index === 0 ? (
                    <TaskAiInsight
                      text={getColumnAiInsight(columnTasks, status)}
                    />
                  ) : null}
                </Fragment>
              ))}
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
      })}
    </div>
  );
}
