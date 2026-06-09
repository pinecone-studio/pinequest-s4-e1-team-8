"use client";

import { TaskDetailForm } from "@/components/tasks/task-detail-form";
import type { TaskListItem, TaskUpdate } from "@/components/tasks/task-types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Link2,
  Maximize2,
  MoreHorizontal,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const update = (change: TaskUpdate) => onUpdate(task.id, change);
  const isDone = task.status === "done";

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[680px] flex-col border-l border-border/60 bg-card shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between gap-4 border-b border-border/50 px-8 py-4">
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
            isDone
              ? "border-emerald-500/40 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-border/60 text-foreground hover:bg-muted",
          )}
          onClick={() => update({ status: isDone ? "doing" : "done" })}
        >
          <CheckCircle2 className={cn("size-4", isDone && "text-emerald-700 dark:text-emerald-400")} />
          {isDone ? "Completed" : "Mark complete"}
        </button>

        <div className="flex items-center gap-1">
          <Avatar className="size-7">
            <AvatarFallback className="bg-violet-500 text-[10px] text-white">
              TS
            </AvatarFallback>
          </Avatar>
          <HeaderIconButton label="Share">
            <Share2 className="size-4" />
          </HeaderIconButton>
          <HeaderIconButton label="Copy link">
            <Link2 className="size-4" />
          </HeaderIconButton>
          <HeaderIconButton label="Expand">
            <Maximize2 className="size-4" />
          </HeaderIconButton>

          <div className="relative">
            <HeaderIconButton
              label="More actions"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreHorizontal className="size-4" />
            </HeaderIconButton>

            {menuOpen ? (
              <div className="absolute right-0 top-9 z-10 min-w-40 rounded-lg border border-border/60 bg-muted py-1 shadow-xl">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-800 dark:text-rose-300 hover:bg-muted/20"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(task.id);
                  }}
                >
                  <Trash2 className="size-4" />
                  Delete task
                </button>
              </div>
            ) : null}
          </div>

          <HeaderIconButton label="Close" onClick={onClose}>
            <X className="size-4" />
          </HeaderIconButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-10 py-8">
        <TaskDetailForm task={task} onUpdate={update} />
      </div>
    </aside>
  );
}

function HeaderIconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}
