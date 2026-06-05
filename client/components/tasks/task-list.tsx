"use client";

import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { EmptyTasks, TaskListSkeleton } from "@/components/tasks/task-list-states";
import { sourceLabels, taskSources } from "@/components/tasks/task-sources";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskTeamFilter } from "@/components/tasks/task-team-filter";
import { useTaskList } from "@/components/tasks/use-task-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ListTodo, RefreshCw } from "lucide-react";

export function TaskList() {
  const {
    activeSource,
    activeTeam,
    addTaskToColumn,
    deleteTask,
    isLoading,
    loadTasks,
    selectedTask,
    selectedTaskId,
    selectSource,
    setActiveTeam,
    setSelectedTaskId,
    sourceTasks,
    updateTask,
    visibleTasks,
  } = useTaskList();

  return (
    <>
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
                    : "border-border/70 bg-card text-muted-foreground hover:text-foreground",
                )}
                onClick={() => selectSource(source)}
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
            <EmptyTasks source={sourceLabels[activeSource]} />
          ) : (
            <div className="min-h-[28rem] overflow-x-auto rounded-lg border border-border/60 p-3">
              <TaskBoard
                tasks={visibleTasks}
                selectedTaskId={selectedTaskId}
                onSelectTask={setSelectedTaskId}
                onAddTask={addTaskToColumn}
                onUpdateTask={updateTask}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTask ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/20"
            aria-label="Close task details"
            onClick={() => setSelectedTaskId(null)}
          />
          <TaskDetailPanel
            task={selectedTask}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onClose={() => setSelectedTaskId(null)}
          />
        </>
      ) : null}
    </>
  );
}
