"use client";

import { clientApi } from "@/app/lib/client-api";
import { sourceLabels, taskSources } from "@/components/tasks/mock-tasks";
import { TaskRow, type TaskListItem, type TaskSource } from "@/components/tasks/task-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ListTodo, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type TasksResponse = {
  tasks: TaskListItem[];
};

function TaskListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="space-y-5 rounded-lg border border-border/50 bg-card p-5 dark:bg-[#18191d]"
        >
          <div className="space-y-2">
            <div className="h-6 max-w-40 rounded bg-muted/60" />
            <div className="h-4 max-w-24 rounded bg-muted/50" />
          </div>
          <div className="flex gap-1">
            <div className="size-9 rounded-full bg-muted/50" />
            <div className="size-9 rounded-full bg-muted/50" />
            <div className="size-9 rounded-full bg-muted/50" />
          </div>
          <div className="space-y-2">
            <div className="h-4 rounded bg-muted/50" />
            <div className="h-1.5 rounded-full bg-muted/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyTasks() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 bg-[#18191d] px-6 text-center">
      <div className="rounded-lg bg-violet-500/15 p-3 text-violet-300">
        <ListTodo className="size-6" />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-semibold">No tasks yet</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          No tasks for this source yet.
        </p>
      </div>
    </div>
  );
}

export function TaskList() {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [activeSource, setActiveSource] = useState<TaskSource>("github");
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data } = await clientApi.get<TasksResponse>("/tasks", {
        params: { source: activeSource },
      });
      setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
    } catch {
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeSource]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return (
    <Card className="rounded-lg border border-border/60 bg-[#16171b] shadow-none">
      <CardHeader className="border-b border-border/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListTodo className="size-5 text-violet-400" />
            Task list
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            disabled={isLoading}
            onClick={loadTasks}
          >
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          {taskSources.map((source) => (
            <button
              key={source}
              type="button"
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                activeSource === source
                  ? "border-violet-500 bg-violet-500 text-white"
                  : "border-border/70 bg-card text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveSource(source)}
            >
              {sourceLabels[source]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <TaskListSkeleton />
        ) : (tasks ?? []).length === 0 ? (
          <EmptyTasks />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(tasks ?? []).map((task, index) => (
              <TaskRow key={task.id} task={task} active={index === 0} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
