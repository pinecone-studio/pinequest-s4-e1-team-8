import {
  taskColumnConfig,
  taskPriorities,
  taskStatuses,
  type TaskListItem,
  type TaskPriority,
  type TaskStatus,
  type TaskUpdate,
} from "@/components/tasks/task-types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { normalizeMembers } from "@/lib/tasks/map-api-task";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

function formatOption(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDueDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export const taskDetailInputClass =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-violet-500";

export const taskDetailTextareaClass =
  "min-h-28 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet-500";

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

type TaskDetailFormProps = {
  task: TaskListItem;
  onUpdate: (change: TaskUpdate) => void;
};

export function TaskDetailForm({ task, onUpdate }: TaskDetailFormProps) {
  const dueDateValue = task.dueDate.slice(0, 10).replaceAll(".", "-");
  const primaryMember =
    normalizeMembers(task.members as unknown[])[0]?.initials ?? "Unassigned";

  return (
    <>
      <input
        className="w-full border-0 bg-transparent text-2xl font-semibold outline-none placeholder:text-muted-foreground"
        value={task.title}
        placeholder="Task name"
        onChange={(event) => onUpdate({ title: event.target.value })}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <DetailField label="Assignee">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2">
            <Avatar className="size-7">
              <AvatarFallback className="bg-violet-500 text-xs text-white">
                {primaryMember.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{primaryMember}</span>
          </div>
        </DetailField>

        <DetailField label="Due date">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className={cn(taskDetailInputClass, "pl-9")}
              inputMode="numeric"
              placeholder="YYYY-MM-DD"
              value={dueDateValue}
              onChange={(event) => onUpdate({ dueDate: event.target.value })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDueDate(task.dueDate)}
          </p>
        </DetailField>

        <DetailField label="Team">
          <div className="rounded-lg border border-border/60 px-3 py-2 text-sm">
            {task.team}
          </div>
        </DetailField>

        <DetailField label="Tool">
          <input
            className={taskDetailInputClass}
            value={task.tool}
            onChange={(event) => onUpdate({ tool: event.target.value })}
          />
        </DetailField>

        <DetailField label="Status">
          <select
            className={taskDetailInputClass}
            value={task.status}
            onChange={(event) =>
              onUpdate({ status: event.target.value as TaskStatus })
            }
          >
            {taskStatuses.map((status) => (
              <option key={status} value={status}>
                {taskColumnConfig[status].label}
              </option>
            ))}
          </select>
        </DetailField>

        <DetailField label="Priority">
          <select
            className={taskDetailInputClass}
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
        </DetailField>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="outline" className="rounded-md capitalize">
          {task.source}
        </Badge>
        {task.blocked ? (
          <Badge variant="destructive" className="rounded-md">
            Blocked
          </Badge>
        ) : null}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold">Description</h3>
        <textarea
          className={cn(taskDetailTextareaClass, "mt-2")}
          placeholder="What is this task about?"
          value={task.description ?? ""}
          onChange={(event) => onUpdate({ description: event.target.value })}
        />
      </div>
    </>
  );
}
