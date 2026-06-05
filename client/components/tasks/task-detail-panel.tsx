"use client";

import { TaskDetailForm } from "@/components/tasks/task-detail-form";
import type { TaskListItem, TaskUpdate } from "@/components/tasks/task-types";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trash2, X } from "lucide-react";

type TaskDetailPanelProps = {
  task: TaskListItem;
  onUpdate: (taskId: string, update: TaskUpdate) => void;
  onDelete: (taskId: string) => void;
  onClose: () => void;
};

export function TaskDetailPanel({
  task,
  onUpdate,
  onDelete,
  onClose,
}: TaskDetailPanelProps) {
  const update = (change: TaskUpdate) => onUpdate(task.id, change);

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-border/60 bg-[#16171b] shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <Button
          type="button"
          variant={task.status === "done" ? "default" : "outline"}
          className="rounded-lg"
          onClick={() =>
            update({ status: task.status === "done" ? "doing" : "done" })
          }
        >
          <CheckCircle2 className="size-4" />
          {task.status === "done" ? "Completed" : "Mark complete"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-lg"
          onClick={onClose}
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <TaskDetailForm task={task} onUpdate={update} />

        <Button
          type="button"
          variant="destructive"
          className="mt-6 rounded-lg"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="size-4" />
          Delete task
        </Button>
      </div>
    </aside>
  );
}
