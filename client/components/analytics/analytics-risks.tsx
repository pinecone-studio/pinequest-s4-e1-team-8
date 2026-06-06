"use client";

import { AnalyticsSectionHeader } from "@/components/analytics/analytics-section-header";
import { clientApi } from "@/app/lib/client-api";
import type { AnalyticsRisks, RiskLevel } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

const levelStyles: Record<RiskLevel, string> = {
  high: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  low: "border-slate-500/40 bg-slate-500/10 text-slate-300",
};

export function AnalyticsRisksPanel() {
  const [risks, setRisks] = useState<AnalyticsRisks | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    clientApi
      .get<{ risks: AnalyticsRisks }>("/analytics/risks")
      .then((response) => {
        if (!cancelled) {
          setRisks(response.data.risks);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load risks. Is the server running?");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-xl border border-border/60 bg-[#16171b] p-4 shadow-sm">
      <AnalyticsSectionHeader
        icon={<AlertTriangle className="size-3.5 text-amber-400" />}
        title="Risk management"
      />

      {error ? (
        <p className="text-sm text-rose-400">{error}</p>
      ) : !risks ? (
        <p className="text-sm text-muted-foreground">Loading risks...</p>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-3">
            <RiskStat label="Blocked" value={risks.blocked} tone="rose" />
            <RiskStat label="Due this week" value={risks.dueThisWeek} tone="amber" />
            <RiskStat label="Urgent" value={risks.urgent} tone="violet" />
          </div>

          <div className="mt-3 space-y-2">
            {risks.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active risks right now.</p>
            ) : (
              risks.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border/60 bg-[#1c1d22] px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.team} · {item.reason}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase",
                        levelStyles[item.level],
                      )}
                    >
                      {item.level}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}

function RiskStat({
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
        ? "text-amber-400"
        : "text-violet-400";

  return (
    <div className="rounded-lg border border-border/60 bg-[#1c1d22] px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-xl font-semibold tabular-nums", toneClass)}>
        {value}
      </p>
    </div>
  );
}
