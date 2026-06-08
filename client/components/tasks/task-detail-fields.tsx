"use client";

import {
  taskPriorities,
  taskStatuses,
  type TaskListItem,
  type TaskPriority,
  type TaskStatus,
  type TaskUpdate,
} from "@/components/tasks/task-types";
import { normalizeMemberInitials } from "@/lib/tasks/map-api-task";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronDown, X } from "lucide-react";
import {
  formatDueDateShort,
  formatOption,
  getSectionLabel,
  getStatusLabel,
  getStatusStyle,
  priorityStyles,
} from "./task-detail-utils";
import {
  detailSelectClass,
  PillBadge,
  PropertyRow,
} from "./task-detail-ui";

type TaskDetailFieldsProps = {
  task: TaskListItem;
  onUpdate: (change: TaskUpdate) => void;
};

export function TaskDetailFields({ task, onUpdate }: TaskDetailFieldsProps) {
  const dueDateValue = task.dueDate.slice(0, 10).replaceAll(".", "-");
  const assignee =
    normalizeMemberInitials((task.members ?? []) as unknown[])[0] ?? "Unassigned";

  return (
    <div className="space-y-1 border-b border-border/50 pb-8">
      <PropertyRow label="Assignee">
        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/60 bg-[#25262b] py-1 pr-2 pl-1">
          <Avatar className="size-6">
            <AvatarFallback className="bg-violet-500 text-[10px] text-white">
              {assignee.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm">{assignee}</span>
          <button
            type="button"
            className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            aria-label="Remove assignee"
          >
            <X className="size-3" />
          </button>
        </div>
      </PropertyRow>

      <PropertyRow label="Due date">
        <div className="inline-flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-[#25262b] py-1 pr-2 pl-2">
            <CalendarDays className="size-3.5 text-muted-foreground" />
            <input
              className="w-28 border-0 bg-transparent text-sm outline-none"
              inputMode="numeric"
              placeholder="YYYY-MM-DD"
              value={dueDateValue}
              onChange={(event) => onUpdate({ dueDate: event.target.value })}
            />
            {dueDateValue ? (
              <button
                type="button"
                className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                aria-label="Clear due date"
                onClick={() => onUpdate({ dueDate: "" })}
              >
                <X className="size-3" />
              </button>
            ) : null}
          </div>
          {dueDateValue ? (
            <span className="text-xs text-muted-foreground">
              {formatDueDateShort(task.dueDate)}
            </span>
          ) : null}
        </div>
      </PropertyRow>

      <PropertyRow label="Dependencies">
        <button
          type="button"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Add dependencies
        </button>
      </PropertyRow>

      <PropertyRow label="Projects">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-[#25262b] px-2.5 py-1 text-sm">
            <span className="size-2 rounded-sm bg-slate-400" />
            {task.team}
          </span>
          <div className="relative inline-flex items-center">
            <select
              className={cn(detailSelectClass, "appearance-none pr-6")}
              value={task.status}
              onChange={(event) =>
                onUpdate({ status: event.target.value as TaskStatus })
              }
            >
              {taskStatuses.map((status) => (
                <option key={status} value={status}>
                  {getSectionLabel(status)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 size-4 text-muted-foreground" />
          </div>
        </div>
      </PropertyRow>

      <PropertyRow label="Priority">
        <div className="relative inline-flex items-center">
          <select
            className={cn(
              detailSelectClass,
              "appearance-none rounded-md border px-2.5 py-1 pr-7",
              priorityStyles[task.priority],
            )}
            value={task.priority}
            onChange={(event) =>
              onUpdate({ priority: event.target.value as TaskPriority })
            }
          >
            {taskPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {formatOption(priority)}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 size-3.5 opacity-70" />
        </div>
      </PropertyRow>

      <PropertyRow label="Status">
        <PillBadge
          label={getStatusLabel(task.status, task.blocked)}
          className={getStatusStyle(task.status, task.blocked)}
        />
      </PropertyRow>

      <PropertyRow label="Tool">
        <input
          className="h-8 w-full max-w-xs border-0 border-b border-transparent bg-transparent text-sm outline-none transition-colors focus:border-border/60"
          value={task.tool}
          placeholder="Add tool"
          onChange={(event) => onUpdate({ tool: event.target.value })}
        />
      </PropertyRow>
    </div>
  );
}
