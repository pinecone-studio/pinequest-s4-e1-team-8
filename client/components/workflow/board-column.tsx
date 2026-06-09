"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { GithubProjectItem } from "@/lib/integrations/github";
import { BoardCard } from "./board-card";
import { Loader2, Plus } from "lucide-react";

type BoardColumnProps = {
  title: string;
  optionId: string | null; // null = "No Status" (read-only drop target)
  items: GithubProjectItem[];
  dragActive: boolean;
  onDropCard: (optionId: string) => void;
  onDragStartCard: (itemId: string) => void;
  onDragEndCard: () => void;
  onAddCard: (optionId: string, title: string) => Promise<void>;
};

export function BoardColumn({
  title,
  optionId,
  items,
  dragActive,
  onDropCard,
  onDragStartCard,
  onDragEndCard,
  onAddCard,
}: BoardColumnProps) {
  const [over, setOver] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  // The Projects v2 API can set a single-select option but not clear it, so the
  // synthetic "No Status" column accepts no drops and cannot add cards.
  const droppable = optionId !== null;

  async function submitAdd() {
    if (!optionId || !draft.trim()) return;
    setSaving(true);
    try {
      await onAddCard(optionId, draft.trim());
      setDraft("");
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onDragOver={(e) => {
        if (!droppable) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        if (!droppable || optionId === null) return;
        e.preventDefault();
        onDropCard(optionId);
      }}
      className={cn(
        "flex w-72 shrink-0 flex-col gap-2 rounded-2xl border bg-muted/30 p-3 transition-colors",
        over && droppable
          ? "border-violet-500/50 ring-1 ring-violet-400 dark:ring-violet-500/30"
          : dragActive && droppable
            ? "border-violet-300 dark:border-violet-500/30"
            : "border-border/60",
      )}
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {items.length}
          </span>
        </div>
        {optionId !== null ? (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="text-muted-foreground hover:text-foreground"
            aria-label={`Add card to ${title}`}
          >
            <Plus className="size-4" />
          </button>
        ) : null}
      </div>

      {adding ? (
        <div className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-card p-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Draft title…"
            rows={2}
            className="resize-none rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!draft.trim() || saving}
              onClick={() => void submitAdd()}
              className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-3 animate-spin" /> : null}
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setDraft("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 px-3 py-6 text-center text-xs text-muted-foreground">
            No items
          </p>
        ) : (
          items.map((item) => (
            <BoardCard
              key={item.id}
              item={item}
              onDragStart={onDragStartCard}
              onDragEnd={onDragEndCard}
            />
          ))
        )}
      </div>
    </div>
  );
}
