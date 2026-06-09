"use client";

import { taskStatuses, type TaskListItem, type TaskUpdate } from "@/components/tasks/task-types";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useEffect, useMemo, useState } from "react";
import type { ColumnItems } from "./types";
import { buildColumnItems, findContainer, resolveOverContainer } from "./utils";

export function useTaskBoardDnd(
  tasks: TaskListItem[],
  onUpdateTask: (taskId: string, update: TaskUpdate) => void,
) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState<ColumnItems>(() => buildColumnItems(tasks));

  const taskMap = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );

  const activeTask = activeId ? taskMap.get(activeId) ?? null : null;

  useEffect(() => {
    if (!activeId) {
      setItems(buildColumnItems(tasks));
    }
  }, [activeId, tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeItemId = String(active.id);
    const overItemId = String(over.id);
    const activeContainer = findContainer(items, activeItemId);
    const overContainer = resolveOverContainer(items, over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setItems((current) => {
      const activeItems = [...current[activeContainer]];
      const overItems = [...current[overContainer]];
      const overIndex = overItems.indexOf(overItemId);

      let nextIndex: number;
      if (taskStatuses.includes(overItemId as (typeof taskStatuses)[number])) {
        nextIndex = overItems.length;
      } else {
        const isBelowOverItem =
          active.rect.current.translated &&
          active.rect.current.translated.top >
            over.rect.top + over.rect.height / 2;

        nextIndex =
          overIndex >= 0
            ? overIndex + (isBelowOverItem ? 1 : 0)
            : overItems.length;
      }

      return {
        ...current,
        [activeContainer]: activeItems.filter((id) => id !== activeItemId),
        [overContainer]: [
          ...overItems.slice(0, nextIndex),
          activeItemId,
          ...overItems.slice(nextIndex),
        ],
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const draggedId = String(active.id);

    if (over) {
      const activeContainer = findContainer(items, draggedId);
      const overContainer = resolveOverContainer(items, over.id);

      if (activeContainer && overContainer && activeContainer === overContainer) {
        const columnItems = items[activeContainer];
        const oldIndex = columnItems.indexOf(draggedId);
        const newIndex = columnItems.indexOf(String(over.id));

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          setItems((current) => ({
            ...current,
            [activeContainer]: arrayMove(
              current[activeContainer],
              oldIndex,
              newIndex,
            ),
          }));
        }
      }

      const task = taskMap.get(draggedId);
      const finalContainer = findContainer(items, draggedId);

      if (task && finalContainer && task.status !== finalContainer) {
        onUpdateTask(draggedId, { status: finalContainer });
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setItems(buildColumnItems(tasks));
  };

  return {
    activeId,
    activeTask,
    handleDragCancel,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
    items,
    sensors,
  };
}
