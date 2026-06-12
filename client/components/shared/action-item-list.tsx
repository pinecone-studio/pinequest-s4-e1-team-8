"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { ActionItem } from "@/types";

type ActionItemListProps = {
  items: ActionItem[];
  onToggle: (id: string) => void;
  emptyMessage: string;
};

export function ActionItemList({ items, onToggle, emptyMessage }: ActionItemListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3">
          <Checkbox checked={item.done} onCheckedChange={() => onToggle(item.id)} className="mt-0.5" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className={cn("text-sm text-foreground", item.done && "text-muted-foreground line-through")}>
              {item.text}
            </span>
            {item.dueLabel ? <span className="text-xs text-muted-foreground">Due {item.dueLabel}</span> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
