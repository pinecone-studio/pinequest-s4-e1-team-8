import { taskColumnConfig, taskStatuses } from "@/components/tasks/task-types";
import { ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

export function TaskListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {taskStatuses.map((status) => (
        <div
          key={status}
          className="flex min-h-[28rem] flex-col overflow-hidden rounded-lg border border-border/60 bg-[#18191d]"
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
                  className="space-y-2 rounded-lg border border-border/50 bg-card p-3 dark:bg-[#1f2024]"
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

export function EmptyTasks({ source }: { source: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 bg-[#18191d] px-6 text-center">
      <div className="rounded-lg bg-violet-500/15 p-3 text-violet-300">
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
