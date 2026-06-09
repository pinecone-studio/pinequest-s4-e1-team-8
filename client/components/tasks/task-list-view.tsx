"use client";

import { TaskEditMenu } from "@/components/tasks/task-edit-menu";
import type { TaskListItem, TaskUpdate } from "@/components/tasks/task-types";
import {
  formatDueDateShort,
  formatOption,
  getSectionLabel,
  getStatusLabel,
  getStatusStyle,
  priorityStyles,
} from "@/components/tasks/task-detail-utils";
import { cn } from "@/lib/utils";

type TaskListViewProps = {
  tasks: TaskListItem[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, update: TaskUpdate) => void;
  onDeleteTask: (taskId: string) => void;
};

function getProgressColor(progress: number) {
  if (progress >= 75) return "bg-emerald-500";
  if (progress >= 50) return "bg-amber-500";
  return "bg-orange-500";
}

export function TaskListView({
  tasks,
  selectedTaskId,
  onSelectTask,
  onUpdateTask,
  onDeleteTask,
}: TaskListViewProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs font-medium text-muted-foreground">
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Progress</th>
              <th className="px-4 py-3 font-medium">Assignee</th>
              <th className="px-4 py-3 font-medium" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const progress = Math.min(Math.max(task.progress, 0), 100);
              const primaryMember = task.members[0];

              return (
                <tr
                  key={task.id}
                  data-task-id={task.id}
                  className={cn(
                    "cursor-pointer border-b border-border/40 transition-colors last:border-b-0 hover:bg-muted/10",
                    selectedTaskId === task.id && "bg-violet-100 dark:bg-violet-500/10",
                  )}
                  onClick={() => onSelectTask(task.id)}
                >
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{task.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {task.tool}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        getStatusStyle(task.status, task.blocked),
                      )}
                    >
                      {getStatusLabel(task.status, task.blocked)}
                    </span>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {getSectionLabel(task.status)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
                        priorityStyles[task.priority],
                      )}
                    >
                      {formatOption(task.priority)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDueDateShort(task.dueDate)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-28 items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            getProgressColor(progress),
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                        {progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {primaryMember ? (
                      <span className="inline-flex size-7 items-center justify-center rounded-full bg-violet-500 text-[10px] font-semibold text-white">
                        {primaryMember.initials}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td
                    className="px-4 py-3"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <TaskEditMenu
                      task={task}
                      onUpdate={onUpdateTask}
                      onDelete={onDeleteTask}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
