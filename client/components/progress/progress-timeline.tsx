"use client";

import { cn } from "@/lib/utils";
import { CalendarRange, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { TimelineGantt } from "./timeline-gantt";
import { TimelineToolbar } from "./timeline-toolbar";
import { timelineSources, type TimelineSource } from "./timeline-types";
import { useProgressItems } from "./use-progress-items";

export function ProgressTimeline() {
  const { items, loading, error, githubUnavailable, hasProject, reload } =
    useProgressItems();
  const [scale, setScale] = useState<"week" | "month" | "quarter">("month");
  const [activeSources, setActiveSources] = useState<Set<TimelineSource>>(
    () => new Set(timelineSources),
  );

  const counts = useMemo(() => {
    const base: Record<TimelineSource, number> = {
      github: 0,
      asana: 0,
      internal: 0,
    };
    for (const item of items) {
      base[item.source] += 1;
    }
    return base;
  }, [items]);

  const visibleItems = useMemo(
    () => items.filter((item) => activeSources.has(item.source)),
    [items, activeSources],
  );

  const toggleSource = (source: TimelineSource) => {
    setActiveSources((current) => {
      const next = new Set(current);
      if (next.has(source)) {
        next.delete(source);
      } else {
        next.add(source);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <CalendarRange className="size-5 text-[#7c3aed]" />
            Interactive Timeline
          </h1>
          <p className="text-sm text-muted-foreground">
            GitHub issues, Asana, and team tasks on one Gantt view.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {visibleItems.length} of {items.length} shown
        </span>
      </div>

      <TimelineToolbar
        counts={counts}
        activeSources={activeSources}
        onToggleSource={toggleSource}
        scale={scale}
        onScaleChange={setScale}
        onReload={reload}
        loading={loading}
      />

      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : githubUnavailable && counts.github === 0 ? (
        <Notice tone="muted">
          GitHub issues aren&apos;t loading — connect a repository to see them on
          the timeline.
        </Notice>
      ) : null}

      {loading && items.length === 0 ? (
        <EmptyState>
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p>Loading timeline…</p>
        </EmptyState>
      ) : visibleItems.length === 0 ? (
        <EmptyState>
          <CalendarRange className="size-6 text-muted-foreground" />
          <p>
            {items.length === 0
              ? hasProject
                ? "No dated issues or tasks yet."
                : "Set up your project to populate the timeline."
              : "No items match the selected sources."}
          </p>
        </EmptyState>
      ) : (
        <TimelineGantt items={visibleItems} scale={scale} />
      )}
    </div>
  );
}

function Notice({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "error" | "muted";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-2.5 text-sm",
        tone === "error"
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border/60 bg-muted/30 text-muted-foreground",
      )}
    >
      {children}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 py-24 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
