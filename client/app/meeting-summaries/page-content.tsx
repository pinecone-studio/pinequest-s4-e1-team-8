"use client";

import { MeetingSummaryCard } from "@/app/meeting/components/meeting-summary-card";
import { useLatestMeetingSummary } from "@/app/meeting/hooks/use-latest-meeting-summary";

export function LatestMeetingSummaryPageContent() {
  const { isLoading, transcript } = useLatestMeetingSummary();

  return (
    <main className="min-h-full px-6 py-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        {isLoading ? (
          <section className="space-y-4 rounded-3xl border border-white/10 bg-[#11101a] p-4">
            <div className="space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-64 max-w-full animate-pulse rounded bg-white/[0.07]" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-white/[0.07]" />
              <div className="h-3 w-full animate-pulse rounded bg-white/[0.05]" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-white/[0.05]" />
            </div>
          </section>
        ) : (
          <MeetingSummaryCard
            description="Most recent AI-generated topics, decisions, and action items"
            summary={transcript?.summary}
            title="Latest Meeting Summary"
          />
        )}
      </div>
    </main>
  );
}
