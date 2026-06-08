"use client";

import { AnalyticsRisksPanel } from "@/components/analytics/analytics-risks";
import { AnalyticsWeekly } from "@/components/analytics/analytics-weekly";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";

type AnalyticsPanel = "risks" | "summary";

export function AnalyticsPanels() {
  const [panel, setPanel] = useState<AnalyticsPanel>("risks");

  return (
    <div className="space-y-5">
      <ToggleGroup
        value={[panel]}
        onValueChange={(next) => {
          const last = next[next.length - 1] as AnalyticsPanel | undefined;
          if (last) setPanel(last);
        }}
        variant="outline"
        className="rounded-xl border-border/60 bg-muted/20 p-0.5"
      >
        <ToggleGroupItem value="risks" className="rounded-lg px-3 text-sm">
          Risk management
        </ToggleGroupItem>
        <ToggleGroupItem value="summary" className="rounded-lg px-3 text-sm">
          Summary
        </ToggleGroupItem>
      </ToggleGroup>

      {panel === "risks" ? <AnalyticsRisksPanel /> : <AnalyticsWeekly />}
    </div>
  );
}
