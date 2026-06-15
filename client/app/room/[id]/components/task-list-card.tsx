"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { TaskItem } from "../types";

type TaskListCardProps = {
  onToggleTask: (id: string) => void;
  tasks: TaskItem[];
};

export const TaskListCard = ({ onToggleTask, tasks }: TaskListCardProps) => {
  const completedCount = tasks.filter((task) => task.completed).length;

  return (
    <section className="rounded-[24px] bg-zinc-950 p-4 text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Tasks</h3>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/70">
          {completedCount}/{tasks.length} done
        </span>
      </div>
      <ul className="mt-3 space-y-2.5">
        {tasks.map((task) => (
          <li className="flex items-center gap-3" key={task.id}>
            <button
              aria-pressed={task.completed}
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border transition",
                task.completed
                  ? "border-emerald-400 bg-emerald-400 text-zinc-950"
                  : "border-white/25 text-transparent hover:border-white/50",
              )}
              onClick={() => onToggleTask(task.id)}
              type="button"
            >
              <Check className="size-3" />
            </button>
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm",
                task.completed ? "text-white/40 line-through" : "text-white/90",
              )}
            >
              {task.label}
            </span>
            {task.dueLabel ? (
              <span className="shrink-0 text-xs text-white/40">{task.dueLabel}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
};
