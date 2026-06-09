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
import {
  deriveGithubColumnsFromTasks,
  readGithubBoardColumns,
  readGithubSyncRepo,
  repoStorageKey,
  toBoardColumnDefinitions,
} from "@/components/tasks/task-board/github-columns";
import { TaskGithubConnect } from "@/components/tasks/task-github-connect";
import type { BoardColumnDefinition } from "@/components/tasks/task-types";
import { GITHUB_SYNCED_EVENT } from "@/lib/integrations/github";
import { TaskBoard } from "@/components/tasks/task-board";
import {
  TaskAiAssistant,
  TaskAiAssistantTrigger,
} from "@/components/tasks/task-ai-assistant";
import { TaskMilestoneFilter } from "@/components/tasks/task-milestone-filter";
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
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export function TaskList() {
  const {
    activeMilestoneId,
    activeSource,
    activeTeam,
    addTaskToColumn,
    deleteTask,
    focusTask,
    hasMilestones,
    isLoading,
    loadTasks,
    selectedTask,
    selectedTaskId,
    selectSource,
    setActiveMilestoneId,
    setActiveTeam,
    setSelectedTaskId,
    sourceTasks,
    teamFilterTasks,
    updateTask,
    visibleTasks,
  } = useTaskList();
  const [viewMode, setViewMode] = useState<TaskViewMode>("board");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [githubBoardColumns, setGithubBoardColumns] = useState<
    BoardColumnDefinition[] | null
  >(null);
  const searchParams = useSearchParams();

  const githubRepoKey = useMemo(() => {
    const syncedRepo = readGithubSyncRepo();
    return syncedRepo ? repoStorageKey(syncedRepo) : null;
  }, [sourceTasks]);

  useEffect(() => {
    if (activeSource !== "github") {
      setGithubBoardColumns(null);
      return;
    }

    if (githubRepoKey) {
      const stored = readGithubBoardColumns(githubRepoKey);
      if (stored?.length) {
        setGithubBoardColumns(toBoardColumnDefinitions(stored));
        return;
      }
    }

    const derived = deriveGithubColumnsFromTasks(
      visibleTasks.map((task) => task.boardColumn),
    );
    setGithubBoardColumns(derived.length > 0 ? derived : null);
  }, [activeSource, githubRepoKey, visibleTasks]);

  useEffect(() => {
    const refreshGithubColumns = () => {
      if (activeSource !== "github" || !githubRepoKey) return;
      const stored = readGithubBoardColumns(githubRepoKey);
      if (stored?.length) {
        setGithubBoardColumns(toBoardColumnDefinitions(stored));
      }
    };

    window.addEventListener(GITHUB_SYNCED_EVENT, refreshGithubColumns);
    return () => window.removeEventListener(GITHUB_SYNCED_EVENT, refreshGithubColumns);
  }, [activeSource, githubRepoKey]);

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
      <CardHeader className="shrink-0 border-b border-border/60">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListTodo className="size-5 text-violet-700 dark:text-violet-400" />
            Task list
          </CardTitle>
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {activeSource === "asana" ? <TaskAsanaHeaderBadge /> : null}
              <TaskAiAssistantTrigger
                open={assistantOpen}
                onOpenChange={setAssistantOpen}
              />
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

      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex shrink-0 flex-wrap gap-2">
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
          <div className="shrink-0">
            <TaskGithubConnect
              onSynced={() => void loadTasks()}
              onBoardColumnsChange={setGithubBoardColumns}
            />
          </div>
        ) : null}

        {activeSource === "asana" ? (
          <div className="shrink-0">
            <TaskAsanaProjectBar />
          </div>
        ) : null}

        <div className="shrink-0">
          {hasMilestones ? (
            <TaskMilestoneFilter
              activeMilestoneId={activeMilestoneId}
              tasks={sourceTasks}
              onChange={setActiveMilestoneId}
            />
          ) : (
            <TaskTeamFilter
              activeTeam={activeTeam}
              tasks={teamFilterTasks}
              onChange={setActiveTeam}
            />
          )}
        </div>

        <div className="flex shrink-0 justify-end">
          <TaskViewToggle value={viewMode} onChange={setViewMode} />
        </div>

        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            {isLoading ? (
              viewMode === "board" ? (
                <TaskListSkeleton />
              ) : (
                <TaskListTableSkeleton />
              )
            ) : visibleTasks.length === 0 ? (
              <EmptyTasks source={sourceLabels[activeSource]} />
            ) : viewMode === "board" ? (
              <TaskBoard
                tasks={visibleTasks}
                selectedTaskId={selectedTaskId}
                onSelectTask={setSelectedTaskId}
                onAddTask={addTaskToColumn}
                onUpdateTask={updateTask}
                columns={
                  activeSource === "github" ? githubBoardColumns ?? undefined : undefined
                }
              />
            ) : (
              <TaskListView
                tasks={visibleTasks}
                selectedTaskId={selectedTaskId}
                onSelectTask={setSelectedTaskId}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
              />
            )}
          </div>

          {assistantOpen ? (
            <TaskAiAssistant
              embedded
              open={assistantOpen}
              onOpenChange={setAssistantOpen}
              tasks={visibleTasks}
              activeSource={activeSource}
              activeTeam={activeTeam}
              selectedTask={selectedTask}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col">
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
    </div>
  );
}
