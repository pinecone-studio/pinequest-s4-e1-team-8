"use client";

import {
  buildPulseNarrative,
  type PulseMetrics,
} from "@/components/analytics/analytics-pulse-utils";
import type { AnalyticsWeekly } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import { useMemo } from "react";

export function AnalyticsPulseSummary({
  activeTeam,
  weekly,
  metrics,
  authorCount,
  className,
}: {
  activeTeam: string | null;
  weekly: AnalyticsWeekly | null;
  metrics: PulseMetrics;
  authorCount: number;
  className?: string;
}) {
  const narrative = useMemo(
    () => buildPulseNarrative(metrics, authorCount, activeTeam, weekly),
    [metrics, authorCount, activeTeam, weekly],
  );

  return (
    <div
      className={cn(
        "group w-full max-w-xs rounded-xl border border-border/50 bg-secondary/95 p-3 shadow-lg backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-violet-100 dark:bg-violet-500/15">
          <FileText className="size-3.5 text-violet-700 dark:text-violet-400/80" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground/90">Summary</p>
          <p className="truncate text-[10px] text-muted-foreground">
            {activeTeam ?? "All teams"}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "mt-2 space-y-2 overflow-hidden text-xs leading-relaxed text-muted-foreground",
          "max-h-9 transition-[max-height] duration-300 ease-out",
          "group-hover:max-h-36 group-hover:overflow-y-auto",
        )}
      >
        {narrative.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <p className="mt-1.5 text-[10px] text-muted-foreground/60 transition-opacity group-hover:opacity-0">
        Hover for full summary
      </p>
    </div>
  );
}
