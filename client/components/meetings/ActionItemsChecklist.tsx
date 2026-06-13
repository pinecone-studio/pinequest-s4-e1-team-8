"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { MeetingDetailsActionItem } from "@/app/meeting";

type ActionItemsChecklistProps = {
  items: MeetingDetailsActionItem[];
};

export const ActionItemsChecklist = ({ items }: ActionItemsChecklistProps) => {
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setCompleted((current) => {
      const next = new Set(current);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  };

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No action items captured</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, index) => {
        const isDone = completed.has(index);

        return (
          <li
            key={`${item.owner}-${index}`}
            className="flex items-start gap-3 rounded-2xl border border-border bg-card px-3 py-2.5"
          >
            <Checkbox
              checked={isDone}
              onCheckedChange={() => toggle(index)}
              className="mt-0.5"
            />
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <Badge className="shrink-0 bg-violet-100 text-violet-800 ring-1 ring-violet-400/20 dark:bg-violet-500/15 dark:text-violet-200">
                {item.owner}
              </Badge>
              <span
                className={cn(
                  "min-w-0 flex-1 text-sm text-foreground/80",
                  isDone && "text-muted-foreground line-through",
                )}
              >
                {item.action}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
