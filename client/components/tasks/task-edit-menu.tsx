"use client";

import { Button } from "@/components/ui/button";
import {
  taskPriorities,
  taskStatuses,
  type TaskListItem,
  type TaskPriority,
  type TaskStatus,
  type TaskUpdate,
} from "@/components/tasks/task-types";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useRef } from "react";

type TaskEditMenuProps = {
  task: TaskListItem;
  onUpdate: (taskId: string, update: TaskUpdate) => void;
  onDelete: (taskId: string) => void;
};

function formatOption(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

const inputClass =
  "h-8 w-full rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-violet-500";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

export function TaskEditMenu({ task, onUpdate, onDelete }: TaskEditMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const dueDateValue = task.dueDate.slice(0, 10).replaceAll(".", "-");
  const update = (change: TaskUpdate) => onUpdate(task.id, change);
  const commit = (change: TaskUpdate) => {
    update(change);
    detailsRef.current?.removeAttribute("open");
  };

  return (
    <details ref={detailsRef} className="group relative shrink-0">
      <summary className="flex size-8 cursor-pointer list-none items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&::-webkit-details-marker]:hidden">
        <span className="sr-only">Edit task</span>
        <MoreHorizontal className="size-5" />
      </summary>

      <div className="absolute right-0 top-10 z-50 max-h-[min(62vh,360px)] w-72 overflow-y-auto overscroll-contain rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
        <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
          Edit task
        </p>

        <div className="mt-2 grid gap-2">
          <Field label="Name">
            <input
              className={inputClass}
              value={task.title}
              onChange={(event) => update({ title: event.target.value })}
            />
          </Field>
          <Field label="Tool">
            <input
              className={inputClass}
              value={task.tool}
              onChange={(event) => update({ tool: event.target.value })}
            />
          </Field>
          <Field label="Due date">
            <input
              className={inputClass}
              inputMode="numeric"
              placeholder="YYYY-MM-DD"
              value={dueDateValue}
              onChange={(event) => update({ dueDate: event.target.value })}
            />
          </Field>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <Field label="Priority">
            <select
              className={inputClass}
              value={task.priority}
              onChange={(event) =>
                commit({ priority: event.target.value as TaskPriority })
              }
            >
              {taskPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {formatOption(priority)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className={inputClass}
              value={task.status}
              onChange={(event) =>
                commit({ status: event.target.value as TaskStatus })
              }
            >
              {taskStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatOption(status)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Button
          type="button"
          variant={task.blocked ? "destructive" : "outline"}
          className="mt-2 w-full justify-start"
          aria-pressed={task.blocked}
          onClick={() => commit({ blocked: !task.blocked })}
        >
          <span className="size-2 rounded-full bg-current opacity-70" />
          Blocked
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="mt-2 w-full justify-start"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="size-4" />
          Delete task
        </Button>
      </div>
    </details>
  );
}
