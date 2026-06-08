"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, List } from "lucide-react";

export type TaskViewMode = "list" | "board";

type TaskViewToggleProps = {
  value: TaskViewMode;
  onChange: (value: TaskViewMode) => void;
};

export function TaskViewToggle({ value, onChange }: TaskViewToggleProps) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next) => {
        const selected = next[next.length - 1] as TaskViewMode | undefined;
        if (selected) onChange(selected);
      }}
      variant="outline"
      className="rounded-lg border-border/60 bg-muted/20 p-0.5"
    >
      <ToggleGroupItem value="board" className="gap-1.5 rounded-md px-3 text-sm">
        <LayoutGrid className="size-3.5" />
        Board
      </ToggleGroupItem>
      <ToggleGroupItem value="list" className="gap-1.5 rounded-md px-3 text-sm">
        <List className="size-3.5" />
        List
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
