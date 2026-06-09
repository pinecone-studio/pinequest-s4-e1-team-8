import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Plus,
} from "lucide-react";

export type TaskSource = "github" | "asana" | "internal";
export type TaskStatus = "todo" | "doing" | "in progress" | "completed";
export type TaskPriority = "low" | "normal" | "medium" | "high" | "urgent";

export type TaskListItem = {
  id: string;
  source: TaskSource;
  title: string;
  tool: string;
  status: TaskStatus;
  priority: TaskPriority;
  blocked: boolean;
  dueDate: string;
  progress: number;
  timeLeft: string;
  doneCount: number;
  blockedCount: number;
  members: string[];
};

type TaskRowProps = {
  task: TaskListItem;
  active?: boolean;
};

const memberColors = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-pink-500",
];

function getProgressColor(progress: number) {
  if (progress >= 75) {
    return "bg-emerald-500";
  }

  if (progress >= 50) {
    return "bg-amber-500";
  }

  return "bg-orange-500";
}

function formatDueDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function TaskRow({ task, active = false }: TaskRowProps) {
  const progress = Math.min(Math.max(task.progress, 0), 100);

  return (
    <article
      className={cn(
        "rounded-lg border bg-card p-5 text-card-foreground shadow-sm transition-colors",
        "hover:border-violet-400/60 dark:bg-card",
        active
          ? "border-violet-500 ring-1 ring-violet-500"
          : "border-border/70",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{task.title}</h2>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {task.tool}
          </p>
        </div>
        <button
          type="button"
          aria-label="Task actions"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
        >
          <MoreHorizontal className="size-5" />
        </button>
      </div>

      <div className="mt-5 flex items-center">
        {task.members.map((member, index) => (
          <span
            key={`${task.id}-${member}`}
            className={cn(
              "grid size-9 place-items-center rounded-full border-2 border-card text-xs font-semibold text-white border-elevated",
              index > 0 && "-ml-2",
              memberColors[index % memberColors.length],
            )}
          >
            {member}
          </span>
        ))}
        <button
          type="button"
          aria-label="Add member"
          className="-ml-1 grid size-9 place-items-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            Progress
          </span>
          <span className="font-semibold">{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", getProgressColor(progress))}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Badge
          variant="secondary"
          className="h-8 rounded-lg px-3 text-sm text-muted-foreground"
        >
          <Clock className="size-4" />
          {task.timeLeft}
        </Badge>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-500" />
            {task.doneCount}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-500" />
            {task.blockedCount}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="rounded-md capitalize">
          {task.status}
        </Badge>
        <Badge variant="outline" className="rounded-md capitalize">
          {task.priority}
        </Badge>
        <span className="flex items-center gap-1">
          <CalendarDays className="size-3.5" />
          {formatDueDate(task.dueDate)}
        </span>
      </div>
    </article>
  );
}
