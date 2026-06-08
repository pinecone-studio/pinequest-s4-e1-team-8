"use client";

import { AnalyticsSectionHeader } from "@/components/analytics/analytics-section-header";
import { clientApi } from "@/app/lib/client-api";
import type { AnalyticsSummary } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function toMetrics(summary: AnalyticsSummary) {
  return {
    total: summary.total,
    done: summary.byStatus.done,
    blocked: summary.blocked,
    progress: summary.avgProgress,
  };
}

export function AnalyticsMetrics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    clientApi
      .get<{ summary: AnalyticsSummary }>("/analytics/summary")
      .then((response) => {
        if (!cancelled) {
          setSummary(response.data.summary);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load metrics. Is the server running?");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(
    () => (summary ? toMetrics(summary) : null),
    [summary],
  );

  return (
    <section className="rounded-xl border border-border/60 bg-[#16171b] p-4 shadow-sm">
      <AnalyticsSectionHeader
        icon={<BarChart3 className="size-3.5 text-violet-400" />}
        title="Metrics"
      />

      {error ? (
        <p className="text-sm text-rose-400">{error}</p>
      ) : !metrics ? (
        <p className="text-sm text-muted-foreground">Loading metrics...</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStat label="Total" value={metrics.total} />
          <SummaryStat
            label="Done"
            value={metrics.done}
            valueClassName="text-emerald-400"
          />
          <SummaryStat
            label="Blocked"
            value={metrics.blocked}
            valueClassName="text-rose-400"
          />
          <SummaryStat
            label="Progress"
            value={`${metrics.progress}%`}
            valueClassName="text-sky-400"
          />
        </div>
      )}
    </section>
  );
}

function SummaryStat({
  label,
  value,
  valueClassName = "text-foreground",
}: {
  label: string;
  value: number | string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-[#1c1d22] px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-xl font-semibold tracking-tight tabular-nums",
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}
