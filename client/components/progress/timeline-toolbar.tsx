"use client";

import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import {
  sourceMeta,
  timelineScales,
  timelineSources,
  type TimelineScale,
  type TimelineSource,
} from "./timeline-types";

type TimelineToolbarProps = {
  counts: Record<TimelineSource, number>;
  activeSources: Set<TimelineSource>;
  onToggleSource: (source: TimelineSource) => void;
  scale: TimelineScale;
  onScaleChange: (scale: TimelineScale) => void;
  onReload: () => void;
  loading: boolean;
};

export function TimelineToolbar({
  counts,
  activeSources,
  onToggleSource,
  scale,
  onScaleChange,
  onReload,
  loading,
}: TimelineToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {timelineSources.map((source) => {
          const meta = sourceMeta[source];
          const active = activeSources.has(source);
          return (
            <button
              key={source}
              type="button"
              onClick={() => onToggleSource(source)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                active
                  ? meta.chipActiveClass
                  : "border-border/60 text-muted-foreground hover:bg-muted/40",
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full transition-opacity",
                  meta.dotClass,
                  active ? "opacity-100" : "opacity-40",
                )}
              />
              {meta.label}
              <span className="tabular-nums text-xs opacity-70">
                {counts[source]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-xl border border-border/60 p-0.5">
          {timelineScales.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onScaleChange(option.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                scale === option.value
                  ? "bg-[#7c3aed] text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onReload}
          title="Refresh timeline"
          className="flex size-9 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </button>
      </div>
    </div>
  );
}
