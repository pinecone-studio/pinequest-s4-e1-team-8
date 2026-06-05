"use client";

import { clientApi } from "@/app/lib/client-api";
import { createMockTask } from "@/components/tasks/task-factory";
import { EmptyTasks, TaskListSkeleton } from "@/components/tasks/task-list-states";
import { mockTasks, sourceLabels, taskSources } from "@/components/tasks/mock-tasks";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskTeamFilter } from "@/components/tasks/task-team-filter";
import {
  getTaskTeam,
  type TaskListItem,
  type TaskSource,
  type TaskUpdate,
} from "@/components/tasks/task-types";
import { mapApiTaskToListItem, type ApiTaskListItem } from "@/lib/tasks/map-api-task";
import { getGithubRepo, syncGithubIssues } from "@/lib/integrations/github";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ListTodo, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type TasksResponse = {
  tasks: ApiTaskListItem[];
};

export function TaskList() {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [activeSource, setActiveSource] = useState<TaskSource>("github");
  const [activeTeam, setActiveTeam] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sourceTasks = useMemo(
    () => tasks.filter((task) => task.source === activeSource),
    [activeSource, tasks],
  );
  const visibleTasks = useMemo(
    () =>
      activeTeam
        ? sourceTasks.filter((task) => getTaskTeam(task) === activeTeam)
        : sourceTasks,
    [activeTeam, sourceTasks],
  );

  const loadTasks = useCallback(async () => {
    setIsLoading(true);

    try {
      if (activeSource === "github" && getGithubRepo()) {
        try {
          await syncGithubIssues();
        } catch {
          // Sync can fail; still load whatever is in the DB.
        }
      }

      const { data } = await clientApi.get<TasksResponse>("/tasks");
      const rows = Array.isArray(data?.tasks) ? data.tasks : [];
      setTasks(rows.map(mapApiTaskToListItem));
    } catch {
      setTasks(mockTasks);
    } finally {
      setIsLoading(false);
    }
  }, [activeSource]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const updateTask = useCallback((taskId: string, update: TaskUpdate) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, ...update } : task)),
    );
  }, []);

  const addTask = useCallback(() => {
    setTasks((current) => {
      const team = activeTeam ?? sourceTasks[0]?.team ?? "General Team";
      return [createMockTask(activeSource, current.length + 1, team), ...current];
    });
  }, [activeSource, activeTeam, sourceTasks]);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((current) => current.filter((task) => task.id !== taskId));
  }, []);

  return (
    <Card className="rounded-lg border border-border/60 bg-[#16171b] shadow-none">
      <CardHeader className="border-b border-border/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListTodo className="size-5 text-violet-400" />
            Task list
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="rounded-lg"
              disabled={isLoading}
              onClick={addTask}
            >
              <Plus className="size-4" />
              Add new task
            </Button>
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
                  : "border-border/70 bg-card text-muted-foreground hover:text-foreground",
              )}
              onClick={() => {
                setActiveSource(source);
                setActiveTeam(null);
              }}
            >
              {sourceLabels[source]}
            </button>
          ))}
        </div>
        <TaskTeamFilter
          activeTeam={activeTeam}
          tasks={sourceTasks}
          onChange={setActiveTeam}
        />

        {isLoading ? (
          <TaskListSkeleton />
        ) : visibleTasks.length === 0 ? (
          <EmptyTasks />
        ) : (
          <TaskBoard
            tasks={visibleTasks}
            onUpdate={updateTask}
            onDelete={deleteTask}
          />
        )}
      </CardContent>
    </Card>
  );
}
