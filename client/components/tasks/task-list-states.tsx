import { taskColumnConfig, taskStatuses } from "@/components/tasks/task-types";
import { ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

export function TaskListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {taskStatuses.map((status) => (
        <div
          key={status}
          className="flex min-h-[280px] flex-col rounded-lg border border-border/60 bg-card"
        >
          <div
            className={cn(
              "h-12 animate-pulse",
              taskColumnConfig[status].headerClassName,
            )}
          />
          <div className="flex flex-1 flex-col gap-3 p-3">
            {Array.from({ length: status === "done" ? 3 : 2 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-lg border border-border/50 bg-card p-3 "
                >
                  <div className="h-4 max-w-[85%] rounded bg-muted/60" />
                  <div className="h-3 max-w-[55%] rounded bg-muted/50" />
                  {index % 2 === 1 ? (
                    <div className="flex justify-end pt-1">
                      <div className="size-9 rounded-full bg-muted/50" />
                    </div>
                  ) : null}
                </div>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TaskListTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
      <div className="space-y-0">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-border/40 px-4 py-4 last:border-b-0"
          >
            <div className="h-4 w-48 animate-pulse rounded bg-muted/60" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-muted/50" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-muted/50" />
            <div className="h-4 w-14 animate-pulse rounded bg-muted/40" />
            <div className="h-1.5 flex-1 animate-pulse rounded-full bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyTasks({ source }: { source: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 bg-card px-6 text-center">
      <div className="rounded-lg bg-violet-100 dark:bg-violet-500/15 p-3 text-violet-800 dark:text-violet-300">
        <ListTodo className="size-6" />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-semibold">No tasks yet</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          No {source} tasks to show. Add a task or connect an integration to get
          started.
        </p>
      </div>
    </div>
  );
}
