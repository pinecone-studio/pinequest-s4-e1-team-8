"use client";

import { AnalyticsBarChart, type ChartBarItem } from "@/components/analytics/analytics-bar-chart";
import { clientApi } from "@/app/lib/client-api";
import type { AnalyticsWeekly, WeeklySummaryResponse } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";
import { CalendarRange, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export function AnalyticsWeekly() {
  const [weekly, setWeekly] = useState<AnalyticsWeekly | null>(null);
  const [recap, setRecap] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recapError, setRecapError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    clientApi
      .get<{ weekly: AnalyticsWeekly }>("/analytics/weekly")
      .then((response) => {
        if (!cancelled) {
          setWeekly(response.data.weekly);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load weekly data. Is the server running?");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const chartItems = useMemo<ChartBarItem[]>(() => {
    if (!weekly) return [];

    return weekly.days.map((day) => ({
      label: day.label,
      value: day.completed,
      gradient: "from-violet-600 to-violet-400",
      glow: "shadow-violet-500/35",
    }));
  }, [weekly]);

  const generateRecap = async () => {
    setIsGenerating(true);
    setRecapError(null);

    try {
      const { data } = await clientApi.post<WeeklySummaryResponse>(
        "/analytics/weekly-summary",
      );
      setRecap(data.summary);
    } catch {
      setRecapError("Could not generate recap. Check GEMINI_API_KEY on the server.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="rounded-xl border border-border/60 bg-[#16171b] p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid size-6 place-items-center rounded-md bg-violet-500/15">
            <CalendarRange className="size-3.5 text-sky-400" />
          </div>
          <h2 className="text-base font-semibold tracking-tight">Weekly summary</h2>
        </div>
        <Button
          type="button"
          size="sm"
          className="rounded-lg bg-violet-600 hover:bg-violet-500"
          disabled={isGenerating || !weekly}
          onClick={generateRecap}
        >
          <Sparkles className={cn("size-4", isGenerating && "animate-pulse")} />
          {isGenerating ? "Generating..." : "Generate recap"}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-rose-400">{error}</p>
      ) : !weekly ? (
        <p className="text-sm text-muted-foreground">Loading weekly data...</p>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <WeeklyStat label="Completed" value={weekly.totals.completed} />
            <WeeklyStat label="Started" value={weekly.totals.started} />
          </div>

          <div className="mt-3 overflow-x-auto">
            <AnalyticsBarChart
              title="Completed per day"
              items={chartItems}
              columns={weekly.days.length}
            />
          </div>

          {recapError ? (
            <p className="mt-3 text-sm text-rose-400">{recapError}</p>
          ) : null}

          {recap ? (
            <div className="mt-3 rounded-lg border border-violet-500/30 bg-violet-500/5 px-3 py-2.5">
              <p className="text-xs font-medium text-violet-300">AI recap</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">{recap}</p>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function WeeklyStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-[#1c1d22] px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums text-sky-400">{value}</p>
    </div>
  );
}
