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
import { TaskDueDatePicker } from "@/components/tasks/task-due-date-picker";
import { ChevronDown, X } from "lucide-react";
import {
  formatOption,
  getSectionLabel,
  getStatusLabel,
  getStatusStyle,
  priorityStyles,
} from "./task-detail-utils";
import {
  detailInputClass,
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
        <div
          className={cn(
            detailInputClass,
            "inline-flex h-9 max-w-xs items-center gap-2 pr-2",
          )}
        >
          <Avatar className="size-6">
            <AvatarFallback className="bg-violet-500 text-[10px] text-white">
              {assignee.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate">{assignee}</span>
          <button
            type="button"
            className="grid size-5 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            aria-label="Remove assignee"
          >
            <X className="size-3" />
          </button>
        </div>
      </PropertyRow>

      <PropertyRow label="Due date">
        <TaskDueDatePicker
          value={dueDateValue}
          onChange={(dueDate) => onUpdate({ dueDate })}
        />
      </PropertyRow>

      <PropertyRow label="Dependencies">
        <button
          type="button"
          className={cn(
            detailInputClass,
            "max-w-xs text-left text-muted-foreground transition-colors hover:text-foreground",
          )}
        >
          Add dependencies
        </button>
      </PropertyRow>

      <PropertyRow label="Projects">
        <div className="flex max-w-xs flex-wrap items-center gap-2">
          <span
            className={cn(
              detailInputClass,
              "inline-flex h-9 items-center gap-2",
            )}
          >
            <span className="size-2 rounded-sm bg-slate-400" />
            {task.team}
          </span>
          <div className="relative min-w-0 flex-1">
            <select
              className={cn(detailSelectClass, "w-full")}
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
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </PropertyRow>

      <PropertyRow label="Priority">
        <div className="relative max-w-xs">
          <select
            className={cn(
              detailSelectClass,
              "w-full",
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
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 opacity-70" />
        </div>
      </PropertyRow>

      <PropertyRow label="Status">
        <div
          className={cn(
            detailInputClass,
            "inline-flex h-9 max-w-xs items-center",
          )}
        >
          <PillBadge
            label={getStatusLabel(task.status, task.blocked)}
            className={getStatusStyle(task.status, task.blocked)}
          />
        </div>
      </PropertyRow>

      <PropertyRow label="Tool">
        <input
          className={cn(detailInputClass, "max-w-xs")}
          value={task.tool}
          placeholder="Add tool"
          onChange={(event) => onUpdate({ tool: event.target.value })}
        />
      </PropertyRow>
    </div>
  );
}
