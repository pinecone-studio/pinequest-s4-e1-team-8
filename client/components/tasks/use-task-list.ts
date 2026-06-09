"use client";

import { clientApi, TASKS_API_BASE } from "@/app/lib/client-api";
import { createTask } from "@/components/tasks/task-factory";
import {
  filterTasksByMilestone,
  isMilestoneParentTask,
  partitionSourceTasks,
} from "@/components/tasks/task-milestone-utils";
import { readStoredTasks, saveStoredTasks } from "@/components/tasks/task-storage";
import {
  getTaskTeam,
  type TaskListItem,
  type TaskSource,
  type TaskStatus,
  type TaskUpdate,
} from "@/components/tasks/task-types";
import { useInternalUserId } from "@/hooks/use-internal-user-id";
import {
  mapApiTaskToListItem,
  type ApiTaskListItem,
} from "@/lib/tasks/map-api-task";
import { useCallback, useEffect, useMemo, useState } from "react";

function mapTasksFromApi(records: ApiTaskListItem[]): TaskListItem[] {
  return records.map(mapApiTaskToListItem);
}

export function useTaskList() {
  const { userId } = useInternalUserId();
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [activeSource, setActiveSource] = useState<TaskSource>("github");
  const [activeTeam, setActiveTeam] = useState<string | null>(null);
  const [activeMilestoneId, setActiveMilestoneId] = useState<
    string | null | undefined
  >(undefined);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sourceTasks = useMemo(
    () => tasks.filter((task) => task.source === activeSource),
    [activeSource, tasks],
  );

  const { milestones, boardTasks } = useMemo(
    () => partitionSourceTasks(sourceTasks),
    [sourceTasks],
  );

  const hasMilestones = milestones.length > 0;

  const visibleTasks = useMemo(() => {
    let filtered = filterTasksByMilestone(boardTasks, activeMilestoneId);

    if (activeTeam) {
      filtered = filtered.filter((task) => getTaskTeam(task) === activeTeam);
    }

    return filtered;
  }, [activeMilestoneId, activeTeam, boardTasks]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );

  const loadTasks = useCallback(async (options?: { silent?: boolean }): Promise<TaskListItem[]> => {
    if (!options?.silent) {
      setIsLoading(true);
    }

    try {
      const { data } = await clientApi.get<{ tasks: ApiTaskListItem[] }>(
        TASKS_API_BASE,
      );
      const next = mapTasksFromApi(data.tasks);
      setTasks(next);
      saveStoredTasks(next);
      return next;
    } catch {
      const fallback = readStoredTasks() ?? [];
      setTasks(fallback);
      return fallback;
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (!isLoading && selectedTaskId && !tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(null);
    }
  }, [isLoading, selectedTaskId, tasks]);

  const focusTask = useCallback(
    async (taskId: string) => {
      const applyFocus = (list: TaskListItem[]) => {
        const task = list.find((entry) => entry.id === taskId);
        if (!task) return false;

        setActiveSource(task.source);
        setActiveTeam(null);
        if (isMilestoneParentTask(task, list)) {
          setActiveMilestoneId(task.id);
        } else if (task.parentId) {
          setActiveMilestoneId(task.parentId);
        } else {
          setActiveMilestoneId(null);
        }
        setSelectedTaskId(taskId);
        return true;
      };

      if (applyFocus(tasks)) return;

      const refreshed = await loadTasks();
      applyFocus(refreshed);
    },
    [loadTasks, tasks],
  );

  const updateTask = useCallback(
    (taskId: string, update: TaskUpdate) => {
      let previousTask: TaskListItem | undefined;
      let taskSource: TaskSource | undefined;

      setTasks((current) => {
        previousTask = current.find((task) => task.id === taskId);
        taskSource = previousTask?.source;

        if (!previousTask) return current;

        const next = current.map((task) =>
          task.id === taskId ? { ...task, ...update } : task,
        );
        saveStoredTasks(next);
        return next;
      });

      if (!previousTask || taskSource === "github") {
        return;
      }

      void clientApi.patch(`${TASKS_API_BASE}/${taskId}`, update).catch(() => {
        if (!previousTask) return;

        setTasks((current) => {
          const next = current.map((task) =>
            task.id === taskId ? previousTask! : task,
          );
          saveStoredTasks(next);
          return next;
        });
      });
    },
    [],
  );

  const addTaskToColumn = useCallback(
    (status: TaskStatus) => {
      const team = activeTeam ?? sourceTasks[0]?.team ?? "General Team";
      const newTask = createTask(activeSource, tasks.length + 1, team, status);
      if (typeof activeMilestoneId === "string") {
        newTask.parentId = activeMilestoneId;
      }

      setTasks((current) => {
        const next = [newTask, ...current];
        saveStoredTasks(next);
        return next;
      });
    },
    [activeMilestoneId, activeSource, activeTeam, sourceTasks, tasks.length],
  );

  const deleteTask = useCallback((taskId: string) => {
    setTasks((current) => {
      const next = current.filter((task) => task.id !== taskId);
      saveStoredTasks(next);
      return next;
    });
    setSelectedTaskId((current) => (current === taskId ? null : current));
  }, []);

  const selectSource = useCallback((source: TaskSource) => {
    setActiveSource(source);
    setActiveTeam(null);
    setActiveMilestoneId(undefined);
    setSelectedTaskId(null);
  }, []);

  return {
    activeMilestoneId,
    activeSource,
    activeTeam,
    addTaskToColumn,
    boardTasks,
    deleteTask,
    focusTask,
    hasMilestones,
    isLoading,
    loadTasks,
    milestoneTasks: milestones,
    selectedTask,
    selectedTaskId,
    selectSource,
    setActiveMilestoneId,
    setActiveTeam,
    setSelectedTaskId,
    sourceTasks,
    teamFilterTasks: boardTasks,
    updateTask,
    visibleTasks,
  };
}
