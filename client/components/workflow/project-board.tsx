"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import type {
  GithubProject,
  GithubProjectField,
  GithubProjectItem,
} from "@/lib/integrations/github";
import { BoardColumn } from "./board-column";
import { findStatusField, groupItemsByStatus, STATUS_FIELD_NAME } from "./workflow-utils";

type ProjectBoardProps = {
  projects: GithubProject[];
  selectedProjectId: string;
  fields: GithubProjectField[];
  items: GithubProjectItem[];
  projectsLoading: boolean;
  boardLoading: boolean;
  draggingId: string | null;
  onSelectProject: (projectId: string) => void;
  onMoveItem: (itemId: string, newOptionId: string) => void;
  onAddCard: (optionId: string, title: string) => Promise<void>;
  onDragStart: (itemId: string) => void;
  onDragEnd: () => void;
};

export function ProjectBoard({
  projects,
  selectedProjectId,
  fields,
  items,
  projectsLoading,
  boardLoading,
  draggingId,
  onSelectProject,
  onMoveItem,
  onAddCard,
  onDragStart,
  onDragEnd,
}: ProjectBoardProps) {
  const statusField = useMemo(() => findStatusField(fields), [fields]);
  const columns = useMemo(
    () => (statusField ? groupItemsByStatus(items, statusField) : []),
    [items, statusField],
  );

  if (projectsLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-violet-700 dark:text-violet-500" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm font-medium text-foreground">No GitHub Projects found</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Create a Project at github.com, then make sure your token has the{" "}
          <code className="text-xs">project</code> scope.
        </p>
      </div>
    );
  }

  const usingFallback =
    statusField !== undefined &&
    statusField.name.toLowerCase() !== STATUS_FIELD_NAME.toLowerCase();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <select
          value={selectedProjectId}
          onChange={(e) => onSelectProject(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        {usingFallback ? (
          <span className="text-xs text-muted-foreground">
            Using field “{statusField.name}” for columns
          </span>
        ) : null}
      </div>

      {boardLoading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-violet-700 dark:text-violet-500" />
        </div>
      ) : !statusField ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-medium text-foreground">No status field</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            This project has no single-select “Status” field. Add one in the project
            settings to use the board.
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 gap-2 overflow-x-auto overflow-y-hidden pb-1">
          {columns.map((col) => (
            <BoardColumn
              key={col.optionId ?? "__no_status__"}
              title={col.name}
              optionId={col.optionId}
              items={col.items}
              dragActive={draggingId !== null}
              onDropCard={(optionId) => {
                if (draggingId) onMoveItem(draggingId, optionId);
              }}
              onDragStartCard={onDragStart}
              onDragEndCard={onDragEnd}
              onAddCard={onAddCard}
            />
          ))}
        </div>
      )}
    </div>
  );
}
