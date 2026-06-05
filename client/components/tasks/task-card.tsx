import { TaskEditMenu } from "@/components/tasks/task-edit-menu";
import type { TaskListItem, TaskUpdate } from "@/components/tasks/task-types";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  task: TaskListItem;
  onUpdate: (taskId: string, update: TaskUpdate) => void;
  onDelete: (taskId: string) => void;
};

const memberColors = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-pink-500",
];

export function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const primaryMember = task.members[0];

  return (
    <article className="relative rounded-lg border border-border/70 bg-card p-3 text-card-foreground shadow-sm transition-colors hover:border-violet-400/50 dark:bg-[#1f2024]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 pr-6">
          <h3 className="truncate text-sm font-semibold leading-snug">
            {task.title}
          </h3>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {task.tool}
          </p>
        </div>
        <TaskEditMenu task={task} onUpdate={onUpdate} onDelete={onDelete} />
      </div>

      {primaryMember ? (
        <div className="mt-3 flex justify-end">
          <span
            className={cn(
              "grid size-9 place-items-center rounded-full text-[11px] font-semibold text-white",
              memberColors[primaryMember.charCodeAt(0) % memberColors.length],
            )}
            title={task.members.join(", ")}
          >
            {primaryMember}
          </span>
        </div>
      ) : null}

      {task.blocked ? (
        <span className="absolute left-3 top-3 size-2 rounded-full bg-rose-500" />
      ) : null}
    </article>
  );
}
