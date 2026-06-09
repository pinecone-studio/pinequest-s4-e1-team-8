"use client";

import { Button } from "@/components/ui/button";
import { useAnalyticsRisks } from "@/hooks/use-analytics-risks";
import type { AnalyticsRiskItem, RiskLevel } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";
import { AlertTriangle, Bell, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const levelStyles: Record<RiskLevel, string> = {
  high: "border-rose-500/40 bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300",
  medium: "border-amber-500/40 bg-amber-100 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200",
  low: "border-slate-400/50 bg-slate-100 text-slate-700 dark:border-slate-500/40 dark:bg-slate-500/10 dark:text-slate-300",
};

type TaskRiskAlertProps = {
  onFocusTask?: (taskId: string) => void;
};

export function TaskRiskAlert({ onFocusTask }: TaskRiskAlertProps) {
  const { risks, isLoading, error, refetch } = useAnalyticsRisks();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const alertCount = risks?.items.length ?? 0;
  const hasHighRisk = risks?.items.some((item) => item.level === "high") ?? false;

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleSelect = (item: AnalyticsRiskItem) => {
    onFocusTask?.(item.id);
    setOpen(false);
  };

  return (
    <div ref={panelRef} className="relative">
      <Button
        type="button"
        variant="outline"
        className={cn(
          "relative rounded-lg",
          hasHighRisk && "border-rose-500/40 hover:border-rose-500/60",
        )}
        aria-label="Risk alerts"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell className={cn("size-4", hasHighRisk && "text-amber-700 dark:text-amber-400")} />
        Risk alerts
        {!isLoading && alertCount > 0 ? (
          <span
            className={cn(
              "absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white",
              hasHighRisk ? "bg-rose-500" : "bg-amber-500",
            )}
          >
            {alertCount > 9 ? "9+" : alertCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-700 dark:text-amber-400" />
              <p className="text-sm font-semibold">Risk alerts</p>
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              aria-label="Close risk alerts"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </button>
          </div>

          {error ? (
            <div className="space-y-2 px-4 py-3">
              <p className="text-sm text-rose-400">{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => void refetch()}
              >
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Loading alerts...
            </p>
          ) : !risks || risks.items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              All clear — no active risks.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 border-b border-border/60 px-4 py-3">
                <AlertStat label="Blocked" value={risks.blocked} tone="rose" />
                <AlertStat
                  label="Due soon"
                  value={risks.dueThisWeek}
                  tone="amber"
                />
                <AlertStat label="Urgent" value={risks.urgent} tone="violet" />
              </div>

              <ul className="max-h-72 overflow-y-auto p-2">
                {risks.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                      onClick={() => handleSelect(item)}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.team} · {item.reason}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                          levelStyles[item.level],
                        )}
                      >
                        {item.level}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function AlertStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "rose" | "amber" | "violet";
}) {
  const toneClass =
    tone === "rose"
      ? "text-rose-400"
      : tone === "amber"
        ? "text-amber-700 dark:text-amber-400"
        : "text-violet-700 dark:text-violet-400";

  return (
    <div className="rounded-lg border border-border/60 bg-secondary px-2 py-2 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-semibold tabular-nums", toneClass)}>
        {value}
      </p>
    </div>
  );
}
