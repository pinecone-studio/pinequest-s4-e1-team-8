"use client";

import { createMockTask } from "@/components/tasks/task-factory";
import { readStoredTasks, saveStoredTasks } from "@/components/tasks/task-storage";
import { mockTasks } from "@/components/tasks/mock-tasks";
import {
  getTaskTeam,
  type TaskListItem,
  type TaskSource,
  type TaskStatus,
  type TaskUpdate,
} from "@/components/tasks/task-types";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useTaskList() {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [activeSource, setActiveSource] = useState<TaskSource>("github");
  const [activeTeam, setActiveTeam] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
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
  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );

  const loadMockTasks = useCallback(() => {
    setIsLoading(true);

    window.setTimeout(() => {
      setTasks(readStoredTasks() ?? mockTasks);
      setIsLoading(false);
    }, 300);
  }, []);

  useEffect(() => {
    loadMockTasks();
  }, [loadMockTasks]);

  useEffect(() => {
    if (!isLoading) {
      saveStoredTasks(tasks);
    }
  }, [isLoading, tasks]);

  useEffect(() => {
    if (selectedTaskId && !tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(null);
    }
  }, [selectedTaskId, tasks]);

  const updateTask = useCallback((taskId: string, update: TaskUpdate) => {
    setTasks((current) => {
      const next = current.map((task) =>
        task.id === taskId ? { ...task, ...update } : task,
      );
      saveStoredTasks(next);
      return next;
    });
  }, []);

  const addTaskToColumn = useCallback(
    (status: TaskStatus) => {
      const team = activeTeam ?? sourceTasks[0]?.team ?? "General Team";
      const newTask = createMockTask(activeSource, tasks.length + 1, team, status);

      setTasks((current) => {
        const next = [newTask, ...current];
        saveStoredTasks(next);
        return next;
      });
    },
    [activeSource, activeTeam, sourceTasks, tasks.length],
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
    setSelectedTaskId(null);
  }, []);

  return {
    activeSource,
    activeTeam,
    addTaskToColumn,
    deleteTask,
    isLoading,
    loadMockTasks,
    selectedTask,
    selectedTaskId,
    selectSource,
    setActiveTeam,
    setSelectedTaskId,
    sourceTasks,
    updateTask,
    visibleTasks,
  };
}
