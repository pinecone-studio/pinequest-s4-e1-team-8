"use client";

import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import {
  EmptyTasks,
  TaskListSkeleton,
  TaskListTableSkeleton,
} from "@/components/tasks/task-list-states";
import { TaskListView } from "@/components/tasks/task-list-view";
import { sourceLabels, taskSources } from "@/components/tasks/task-sources";
import {
  TaskAsanaErrorMessage,
  TaskAsanaHeaderActions,
  TaskAsanaHeaderBadge,
  TaskAsanaProjectBar,
  TaskAsanaProvider,
} from "@/components/tasks/task-asana-connect";
import { TaskGithubConnect } from "@/components/tasks/task-github-connect";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskRiskAlert } from "@/components/tasks/task-risk-alert";
import { TaskTeamFilter } from "@/components/tasks/task-team-filter";
import {
  TaskViewToggle,
  type TaskViewMode,
} from "@/components/tasks/task-view-toggle";
import { useTaskList } from "@/components/tasks/use-task-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ListTodo, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function TaskList() {
  const {
    activeSource,
    activeTeam,
    addTaskToColumn,
    deleteTask,
    focusTask,
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
  const [viewMode, setViewMode] = useState<TaskViewMode>("board");
  const searchParams = useSearchParams();

  useEffect(() => {
    if (
      searchParams.get("asana_connected") === "1" ||
      searchParams.get("asana_error")
    ) {
      selectSource("asana");
    }
  }, [searchParams, selectSource]);

  const card = (
    <Card className="rounded-lg border border-border/60 bg-card shadow-none">
      <CardHeader className="border-b border-border/60">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListTodo className="size-5 text-violet-700 dark:text-violet-400" />
            Task list
          </CardTitle>
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {activeSource === "asana" ? <TaskAsanaHeaderBadge /> : null}
              <TaskRiskAlert onFocusTask={focusTask} />
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
            {activeSource === "asana" ? <TaskAsanaHeaderActions /> : null}
          </div>
        </div>
        {activeSource === "asana" ? (
          <div className="mt-2 flex justify-end">
            <TaskAsanaErrorMessage />
          </div>
        ) : null}
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
                  ? "border-violet-600 bg-violet-600 text-white dark:border-violet-500 dark:bg-violet-500"
                  : "border-border/70 bg-card text-muted-foreground hover:text-foreground",
              )}
              onClick={() => selectSource(source)}
            >
              {sourceLabels[source]}
            </button>
          ))}
        </div>

        {activeSource === "github" ? (
          <TaskGithubConnect onSynced={() => void loadTasks()} />
        ) : null}

        {activeSource === "asana" ? <TaskAsanaProjectBar /> : null}

        {activeSource === "internal" ? (
          <TaskTeamFilter
            activeTeam={activeTeam}
            tasks={sourceTasks}
            onChange={setActiveTeam}
          />
        ) : null}

        <div className="flex justify-end">
          <TaskViewToggle value={viewMode} onChange={setViewMode} />
        </div>

        {isLoading ? (
          viewMode === "board" ? (
            <TaskListSkeleton />
          ) : (
            <TaskListTableSkeleton />
          )
        ) : visibleTasks.length === 0 ? (
          <EmptyTasks source={sourceLabels[activeSource]} />
        ) : viewMode === "board" ? (
          <div className="min-h-[28rem] overflow-x-auto">
            <TaskBoard
              tasks={visibleTasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              onAddTask={addTaskToColumn}
              onUpdateTask={updateTask}
            />
          </div>
        ) : (
          <TaskListView
            tasks={visibleTasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={setSelectedTaskId}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      {activeSource === "asana" ? (
        <TaskAsanaProvider
          oauthError={searchParams.get("asana_error")}
          onSynced={() => void loadTasks()}
        >
          {card}
        </TaskAsanaProvider>
      ) : (
        card
      )}

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
