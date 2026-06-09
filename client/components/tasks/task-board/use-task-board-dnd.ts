"use client";

import type { BoardColumnDefinition, TaskListItem, TaskUpdate } from "@/components/tasks/task-types";
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
import {
  buildColumnItems,
  findContainer,
  mapBoardColumnToTaskStatus,
  resolveOverContainer,
} from "./utils";

type UseTaskBoardDndOptions = {
  columns: BoardColumnDefinition[];
  getTaskColumnKey: (task: TaskListItem) => string;
  useBoardColumnUpdates?: boolean;
};

export function useTaskBoardDnd(
  tasks: TaskListItem[],
  onUpdateTask: (taskId: string, update: TaskUpdate) => void,
  options: UseTaskBoardDndOptions,
) {
  const { columns, getTaskColumnKey, useBoardColumnUpdates = false } = options;
  const columnIds = useMemo(() => columns.map((column) => column.id), [columns]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState<ColumnItems>(() =>
    buildColumnItems(tasks, columns, getTaskColumnKey),
  );

  const taskMap = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );

  const activeTask = activeId ? taskMap.get(activeId) ?? null : null;

  useEffect(() => {
    if (!activeId) {
      setItems(buildColumnItems(tasks, columns, getTaskColumnKey));
    }
  }, [activeId, columns, getTaskColumnKey, tasks]);

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
    const activeContainer = findContainer(items, columnIds, activeItemId);
    const overContainer = resolveOverContainer(items, columnIds, over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setItems((current) => {
      const activeItems = [...current[activeContainer]];
      const overItems = [...current[overContainer]];
      const overIndex = overItems.indexOf(overItemId);

      let nextIndex: number;
      if (columnIds.includes(overItemId)) {
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
    let nextItems = items;

    if (over) {
      nextItems = { ...items };
      const activeContainer = findContainer(items, columnIds, draggedId);
      const overContainer = resolveOverContainer(items, columnIds, over.id);

      if (
        activeContainer &&
        overContainer &&
        activeContainer === overContainer
      ) {
        const columnItems = items[activeContainer];
        const oldIndex = columnItems.indexOf(draggedId);
        const newIndex = columnItems.indexOf(String(over.id));

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          nextItems = {
            ...items,
            [activeContainer]: arrayMove(items[activeContainer], oldIndex, newIndex),
          };
        }
      } else if (activeContainer && overContainer) {
        const activeItems = [...items[activeContainer]];
        const overItems = [...items[overContainer]];
        nextItems = {
          ...items,
          [activeContainer]: activeItems.filter((id) => id !== draggedId),
          [overContainer]: [...overItems, draggedId],
        };
      }

      setItems(nextItems);
    }

    const task = taskMap.get(draggedId);
    const finalContainer = findContainer(nextItems, columnIds, draggedId);

    if (task && finalContainer) {
      const currentColumn = getTaskColumnKey(task);
      if (currentColumn !== finalContainer) {
        const update: TaskUpdate = useBoardColumnUpdates
          ? {
              boardColumn: finalContainer,
              status: mapBoardColumnToTaskStatus(finalContainer),
            }
          : { status: mapBoardColumnToTaskStatus(finalContainer) };
        onUpdateTask(draggedId, update);
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setItems(buildColumnItems(tasks, columns, getTaskColumnKey));
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
