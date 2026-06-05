"use client";

import type { TaskListItem, TaskUpdate } from "@/components/tasks/task-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { normalizeMembers } from "@/lib/tasks/map-api-task";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type TaskCardProps = {
  task: TaskListItem;
  selected?: boolean;
  onSelect: (taskId: string) => void;
  onUpdate: (taskId: string, update: TaskUpdate) => void;
};

const memberColors = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-pink-500",
];

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

export function TaskCard({
  task,
  selected = false,
  onSelect,
  onUpdate,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const primaryMember = task.members[0];

  useEffect(() => {
    if (!isEditing) {
      setDraftTitle(task.title);
    }
  }, [isEditing, task.title]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const saveTitle = () => {
    const nextTitle = draftTitle.trim();

    if (nextTitle && nextTitle !== task.title) {
      onUpdate(task.id, { title: nextTitle });
    } else {
      setDraftTitle(task.title);
    }

    setIsEditing(false);
  };

  const startEditing = (event: React.MouseEvent) => {
    event.stopPropagation();
    setDraftTitle(task.title);
    setIsEditing(true);
  };

  return (
    <article
      className={cn(
        "group relative w-full rounded-lg border bg-card text-card-foreground shadow-sm transition-colors dark:bg-[#1f2024]",
        "hover:border-violet-400/50",
        selected
          ? "border-violet-500 ring-1 ring-violet-500"
          : "border-border/70",
      )}
    >
      {isEditing ? (
        <div className="p-3">
          <input
            ref={inputRef}
            className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm font-semibold outline-none focus:border-violet-500"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onBlur={saveTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                saveTitle();
              }

              if (event.key === "Escape") {
                event.preventDefault();
                setDraftTitle(task.title);
                setIsEditing(false);
              }
            }}
          />
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => onSelect(task.id)}
            className="w-full p-3 pr-10 text-left"
          >
            <h3 className="truncate text-sm font-semibold leading-snug">
              {task.title}
            </h3>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {task.tool}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatDueDate(task.dueDate)}
            </p>

            {primaryMember ? (
              <div className="mt-3 flex justify-end">
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full text-[11px] font-semibold text-white",
                    memberColors[
                      primaryMember.charCodeAt(0) % memberColors.length
                    ],
                  )}
                  title={task.members.join(", ")}
                >
                  {primaryMember}
                </span>
              </div>
            ) : null}
          </button>

          <button
            type="button"
            aria-label="Rename task"
            className={cn(
              "absolute top-2 right-2 grid size-7 place-items-center rounded-md border border-border/60 bg-[#25262b] text-muted-foreground opacity-0 transition-opacity",
              "group-hover:opacity-100 hover:border-violet-400/50 hover:text-foreground",
              selected && "opacity-100",
            )}
            onClick={startEditing}
          >
            <Pencil className="size-3.5" />
          </button>
        </>
      )}

      {task.blocked ? (
        <span className="absolute top-3 left-3 size-2 rounded-full bg-rose-500" />
      ) : null}
    </article>
  );
}
