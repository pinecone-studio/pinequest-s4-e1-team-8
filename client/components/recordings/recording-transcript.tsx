"use client";

import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import type { TranscriptEntry } from "@/types";

function TranscriptList({ entries, language }: { entries: TranscriptEntry[]; language: "en" | "mn" }) {
  return (
    <ol className="flex flex-col gap-4">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3">
          <span className="w-12 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
            {entry.timestampLabel}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{entry.speaker}</p>
            <p className="text-sm text-muted-foreground">{language === "en" ? entry.textEn : entry.textMn}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function RecordingTranscript({ entries }: { entries: TranscriptEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No transcript is available for this recording.</p>;
  }

  return (
    <Tabs defaultValue="en">
      <TabsList>
        <TabsIndicator />
        <TabsTab value="en">English</TabsTab>
        <TabsTab value="mn">Mongolian</TabsTab>
      </TabsList>
      <TabsPanel value="en">
        <TranscriptList entries={entries} language="en" />
      </TabsPanel>
      <TabsPanel value="mn">
        <TranscriptList entries={entries} language="mn" />
      </TabsPanel>
    </Tabs>
  );
}
