export const taskStatuses = [
  "backlog",
  "doing",
  "review",
  "done",
] as const;

export const taskColumnConfig: Record<
  TaskStatus,
  { label: string; headerClassName: string }
> = {
  backlog: {
    label: "Backlog",
    headerClassName: "border-b border-border/60 bg-muted/30 text-muted-foreground",
  },
  doing: {
    label: "Doing",
    headerClassName: "border-b border-border/60 bg-violet-500/15 text-violet-300",
  },
  review: {
    label: "Review",
    headerClassName: "border-b border-border/60 bg-amber-500/10 text-amber-200/90",
  },
  done: {
    label: "Done",
    headerClassName: "border-b border-border/60 bg-emerald-500/10 text-emerald-300/90",
  },
};

const legacyStatusMap: Record<string, TaskStatus> = {
  todo: "backlog",
  "in progress": "review",
  completed: "done",
};

export function normalizeTaskStatus(status: string): TaskStatus {
  if (taskStatuses.includes(status as TaskStatus)) {
    return status as TaskStatus;
  }

  return legacyStatusMap[status] ?? "backlog";
}
export const taskPriorities = ["low", "normal", "medium", "high", "urgent"] as const;

export type TaskSource = "github" | "asana" | "internal";
export type TaskStatus = (typeof taskStatuses)[number];
export type TaskPriority = (typeof taskPriorities)[number];

export type TaskMember = {
  initials: string;
  avatarUrl?: string;
};

export type TaskListItem = {
  id: string;
  source: TaskSource;
  team: string;
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
  description?: string;
};

export type TaskUpdate = Partial<
  Pick<
    TaskListItem,
    "title" | "tool" | "status" | "priority" | "blocked" | "dueDate" | "description"
  >
>;

export function getTaskTeam(task: Pick<TaskListItem, "team" | "title">) {
  return task.team || task.title;
}
