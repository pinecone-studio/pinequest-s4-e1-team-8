"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { MilestoneDraft } from "@/lib/onboarding/parse-milestone-drafts";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";

type MilestoneDraftRowProps = {
  draft: MilestoneDraft;
  milestoneIndex: number;
  onUpdateTitle: (milestoneIndex: number, title: string) => void;
  onUpdateTask: (milestoneIndex: number, taskIndex: number, value: string) => void;
  onAddTask: (milestoneIndex: number) => void;
  onRemoveTask: (milestoneIndex: number, taskIndex: number) => void;
  onDeleteMilestone: (milestoneIndex: number) => void;
  onToggleApproval: (milestoneIndex: number) => void;
};

export function MilestoneDraftRow({
  draft,
  milestoneIndex,
  onUpdateTitle,
  onUpdateTask,
  onAddTask,
  onRemoveTask,
  onDeleteMilestone,
  onToggleApproval,
}: MilestoneDraftRowProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const commitTitle = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && trimmed !== draft.title) {
        onUpdateTitle(milestoneIndex, trimmed);
      }
      setIsEditingTitle(false);
    },
    [draft.title, milestoneIndex, onUpdateTitle],
  );

  const commitTask = useCallback(
    (taskIndex: number, value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        onRemoveTask(milestoneIndex, taskIndex);
      } else if (trimmed !== draft.tasks[taskIndex]) {
        onUpdateTask(milestoneIndex, taskIndex, trimmed);
      }
      setEditingTaskIndex(null);
    },
    [draft.tasks, milestoneIndex, onRemoveTask, onUpdateTask],
  );

  const handleTitleClick = useCallback(() => {
    setIsEditingTitle(true);
    requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    });
  }, []);

  const handleTaskClick = useCallback((taskIndex: number) => {
    setEditingTaskIndex(taskIndex);
  }, []);

  const handleAddTask = useCallback(() => {
    onAddTask(milestoneIndex);
    setEditingTaskIndex(draft.tasks.length);
  }, [draft.tasks.length, milestoneIndex, onAddTask]);

  return (
    <article
      className={cn(
        "rounded-xl border p-4 transition-all duration-300",
        draft.isApproved
          ? "border-emerald-500/50 bg-emerald-100 dark:bg-emerald-500/10 shadow-[0_0_20px_rgba(34,197,94,0.08)]"
          : "border-dashed border-violet-300 dark:border-violet-500/25 bg-secondary/90",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              defaultValue={draft.title}
              onBlur={(event) => commitTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitTitle(event.currentTarget.value);
                }
                if (event.key === "Escape") {
                  setIsEditingTitle(false);
                }
              }}
              className="h-8 border-border bg-secondary text-sm font-semibold text-foreground focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20"
            />
          ) : (
            <button
              type="button"
              onClick={handleTitleClick}
              className="w-full text-left text-sm font-semibold text-foreground transition-colors hover:text-violet-700 dark:hover:text-violet-200"
            >
              {draft.title}
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1 transition-colors hover:border-emerald-500/30">
            <Checkbox
              checked={draft.isApproved}
              onCheckedChange={() => onToggleApproval(milestoneIndex)}
              className="size-3.5"
            />
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wide",
                draft.isApproved ? "text-emerald-800 dark:text-emerald-300" : "text-muted-foreground",
              )}
            >
              Approve
            </span>
          </label>
          <button
            type="button"
            onClick={() => onDeleteMilestone(milestoneIndex)}
            className="rounded-md border border-border px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:border-rose-500/40 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
          >
            Delete Card
          </button>
        </div>
      </div>

      {draft.tasks.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {draft.tasks.map((task, taskIndex) => {
            const isEditingTask =
              editingTaskIndex === taskIndex || task.trim().length === 0;

            return (
              <li
                key={`${draft.id}-task-${taskIndex}`}
                className="flex items-center gap-2"
              >
                <span className="mt-0 size-1.5 shrink-0 rounded-full bg-violet-400/80" />
                {isEditingTask ? (
                  <Input
                    autoFocus={editingTaskIndex === taskIndex}
                    defaultValue={task}
                    placeholder="Task description"
                    onBlur={(event) => commitTask(taskIndex, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        commitTask(taskIndex, event.currentTarget.value);
                      }
                      if (event.key === "Escape") {
                        setEditingTaskIndex(null);
                      }
                    }}
                    className="h-7 flex-1 border-border bg-secondary text-[13px] text-foreground focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => handleTaskClick(taskIndex)}
                    className="min-w-0 flex-1 text-left text-[13px] leading-snug text-foreground transition-colors hover:text-foreground"
                  >
                    {task}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveTask(milestoneIndex, taskIndex)}
                  className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-rose-400"
                  aria-label="Remove task"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] text-foreground/80">No tasks yet</p>
      )}

      <button
        type="button"
        onClick={handleAddTask}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-violet-500/40 hover:bg-violet-100 dark:hover:bg-violet-500/5 hover:text-violet-800 dark:hover:text-violet-200"
      >
        <Plus size={14} />
        Add Task
      </button>
    </article>
  );
}
