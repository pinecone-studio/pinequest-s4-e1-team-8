import { TaskCard } from "@/components/tasks/task-card";
import {
  taskColumnConfig,
  taskStatuses,
  type TaskListItem,
  type TaskStatus,
  type TaskUpdate,
} from "@/components/tasks/task-types";
import { cn } from "@/lib/utils";

type TaskBoardProps = {
  tasks: TaskListItem[];
  onUpdate: (taskId: string, update: TaskUpdate) => void;
  onDelete: (taskId: string) => void;
};

export function TaskBoard({ tasks, onUpdate, onDelete }: TaskBoardProps) {
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
            </header>
            <div className="flex flex-1 flex-col gap-3 p-3">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
