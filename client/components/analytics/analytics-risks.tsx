"use client";

import { AnalyticsMetrics } from "@/components/analytics/analytics-metrics";
import { AnalyticsRisksAskPanel } from "@/components/analytics/analytics-risk-ask";
import { AnalyticsSectionHeader } from "@/components/analytics/analytics-section-header";
import { useAnalyticsRisks } from "@/hooks/use-analytics-risks";
import type { AnalyticsRiskItem, AnalyticsRisks, RiskLevel } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { useMemo } from "react";

const levelConfig: Record<
  RiskLevel,
  {
    bar: string;
    label: string;
    text: string;
  }
> = {
  high: {
    bar: "bg-rose-900/80",
    label: "High",
    text: "text-rose-300/80",
  },
  medium: {
    bar: "bg-amber-900/70",
    label: "Medium",
    text: "text-amber-200/70",
  },
  low: {
    bar: "bg-slate-600/80",
    label: "Low",
    text: "text-slate-400/80",
  },
};

function RiskRing({
  value,
  stroke,
  track,
  size = 56,
  center,
}: {
  value: number;
  stroke: string;
  track: string;
  size?: number;
  center?: string;
}) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={track}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      {center ? (
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums text-foreground/80">
          {center}
        </span>
      ) : null}
    </div>
  );
}

const statRingConfig = {
  violet: { ring: "#6b5f8a", track: "#2a2835" },
  rose: { ring: "#9f6068", track: "#3a2a2d" },
  amber: { ring: "#8a7350", track: "#2f2a22" },
} as const;

function RiskStatRing({
  label,
  value,
  fillPct,
  tone,
}: {
  label: string;
  value: number;
  fillPct: number;
  tone: keyof typeof statRingConfig;
}) {
  const colors = statRingConfig[tone];

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border/60 bg-[#1c1d22] px-3 py-3">
      <RiskRing
        value={fillPct}
        stroke={colors.ring}
        track={colors.track}
        center={String(value)}
      />
      <p className="text-center text-[11px] font-medium text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function TopRisksChart({ items }: { items: AnalyticsRiskItem[] }) {
  const counts = useMemo(
    () => ({
      high: items.filter((item) => item.level === "high").length,
      medium: items.filter((item) => item.level === "medium").length,
      low: items.filter((item) => item.level === "low").length,
    }),
    [items],
  );

  const total = items.length;
  const maxCount = Math.max(counts.high, counts.medium, counts.low, 1);

  const columns: { level: RiskLevel; count: number }[] = [
    { level: "high", count: counts.high },
    { level: "medium", count: counts.medium },
    { level: "low", count: counts.low },
  ];

  return (
    <div className="flex h-full flex-col rounded-lg border border-border/50 bg-[#18191d]/60 p-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground">
          Breakdown by severity
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/80">
          {total} active risk{total === 1 ? "" : "s"} — each bar shows how many
          fall into that level
        </p>
      </div>

      <div className="mt-5 grid flex-1 grid-cols-3 items-end gap-3">
        {columns.map(({ level, count }) => {
          const config = levelConfig[level];
          const share = total > 0 ? Math.round((count / total) * 100) : 0;
          const barHeight =
            count === 0
              ? 4
              : Math.max(Math.round((count / maxCount) * 88), 16);

          return (
            <div key={level} className="flex flex-col items-center">
              <span className="text-lg font-semibold tabular-nums text-foreground/90">
                {count}
              </span>

              <div className="relative mt-2 flex h-28 w-full items-end justify-center px-2">
                <div className="absolute inset-x-3 bottom-0 h-px bg-border/40" />
                <div
                  className={cn(
                    "relative w-full max-w-12 border border-white/5 transition-all duration-500",
                    config.bar,
                  )}
                  style={{ height: barHeight }}
                  title={`${config.label}: ${count} risk${count === 1 ? "" : "s"}`}
                />
              </div>

              <div className="mt-3 text-center">
                <p className={cn("text-xs font-medium", config.text)}>
                  {config.label}
                </p>
                <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                  {share}% of total
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopRisksSection({
  items,
  risks,
}: {
  items: AnalyticsRiskItem[];
  risks: AnalyticsRisks;
}) {
  if (items.length === 0) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <p className="text-sm text-muted-foreground">No active risks to chart.</p>
        <AnalyticsRisksAskPanel risks={risks} />
      </div>
    );
  }

  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-2">
      <TopRisksChart items={items} />
      <AnalyticsRisksAskPanel risks={risks} />
    </div>
  );
}

export function AnalyticsRisksPanel() {
  const { risks, isLoading, error } = useAnalyticsRisks();
  const totalActive = risks?.items.length ?? 0;

  const statMax = risks
    ? Math.max(totalActive, risks.blocked, risks.dueThisWeek, risks.urgent, 1)
    : 1;

  const ringPct = (value: number) => Math.round((value / statMax) * 100);

  return (
    <div className="flex flex-col gap-5">
      <AnalyticsMetrics />

      <section className="rounded-xl border border-border/60 bg-[#16171b] p-4 shadow-sm">
        <AnalyticsSectionHeader
          icon={<AlertTriangle className="size-3.5 text-amber-400/70" />}
          title="Risk management"
        />

        {error ? (
          <p className="text-sm text-rose-400/80">{error}</p>
        ) : isLoading || !risks ? (
          <p className="text-sm text-muted-foreground">Loading risks...</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <RiskStatRing
                label="Active risks"
                value={totalActive}
                fillPct={ringPct(totalActive)}
                tone="violet"
              />
              <RiskStatRing
                label="Blocked"
                value={risks.blocked}
                fillPct={ringPct(risks.blocked)}
                tone="rose"
              />
              <RiskStatRing
                label="Due this week"
                value={risks.dueThisWeek}
                fillPct={ringPct(risks.dueThisWeek)}
                tone="amber"
              />
              <RiskStatRing
                label="Urgent"
                value={risks.urgent}
                fillPct={ringPct(risks.urgent)}
                tone="violet"
              />
            </div>

            <div className="rounded-lg border border-border/60 bg-[#1c1d22] p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Top risks
              </p>
              <div className="mt-4">
                <TopRisksSection items={risks.items} risks={risks} />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
