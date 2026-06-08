"use client";

import { MeetingSummaryCard } from "@/app/meeting/components/meeting-summary-card";
import { useMeetingSummaries } from "@/app/meeting/hooks/use-meeting-summaries";
import type {
  GetMeetingTranscriptResponse,
  MeetingTranscriptionStatus,
} from "@/app/meeting/types/meeting-response.types";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useState } from "react";

const statusStyles: Record<MeetingTranscriptionStatus, string> = {
  done: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  failed: "border-red-400/30 bg-red-500/15 text-red-100",
  pending: "border-white/10 bg-white/[0.05] text-zinc-300",
  processing: "border-violet-400/30 bg-violet-500/15 text-violet-100",
};

const formatSummaryDate = (transcript: GetMeetingTranscriptResponse) => {
  const value =
    transcript.completedAt ?? transcript.updatedAt ?? transcript.createdAt;

  if (!value) return "Date unavailable";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export function LatestMeetingSummaryPageContent() {
  const {
    deleteSummary,
    deletingId,
    error,
    isLoading,
    refreshSummaries,
    transcripts,
  } = useMeetingSummaries();
  const [copiedId, setCopiedId] = useState("");
  const [openTranscriptIds, setOpenTranscriptIds] = useState<string[]>([]);

  const handleCopySummary = async (transcript: GetMeetingTranscriptResponse) => {
    const text = transcript.summary ?? transcript.transcript;
    if (!text) return;

    await navigator.clipboard.writeText(text);
    setCopiedId(transcript.id);
    window.setTimeout(() => setCopiedId(""), 1600);
  };

  const toggleTranscript = (id: string) => {
    setOpenTranscriptIds((current) =>
      current.includes(id)
        ? current.filter((openId) => openId !== id)
        : [...current, id],
    );
  };

  return (
    <main className="min-h-full px-6 py-6 text-white">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Meeting Summaries
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Persisted transcripts and AI summaries from recorded meetings.
            </p>
          </div>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-xs font-semibold text-zinc-100 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            onClick={() => void refreshSummaries()}
            type="button"
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            Refresh
          </button>
        </header>

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
        ) : null}

        {!isLoading && error ? (
          <section className="rounded-3xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </section>
        ) : null}

        {!isLoading && !error && !transcripts.length ? (
          <section className="rounded-3xl border border-white/10 bg-[#11101a] p-6 text-sm text-zinc-400">
            No meeting summaries yet
          </section>
        ) : null}

        {!isLoading && !error ? (
          <div className="space-y-5">
            {transcripts.map((transcript, index) => {
              const isLatest = index === 0;
              const isTranscriptOpen = openTranscriptIds.includes(transcript.id);
              const canCopy = Boolean(transcript.summary ?? transcript.transcript);

              return (
                <article
                  className={cn(
                    "overflow-hidden rounded-3xl border bg-[#11101a] shadow-lg shadow-black/10",
                    isLatest
                      ? "border-violet-400/30"
                      : "border-white/10",
                  )}
                  key={transcript.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.08] bg-white/[0.025] p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {isLatest ? (
                          <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-[11px] font-semibold text-violet-100">
                            Latest
                          </span>
                        ) : null}
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize",
                            statusStyles[transcript.status],
                          )}
                        >
                          {transcript.status}
                        </span>
                      </div>
                      <h2 className="mt-3 truncate text-base font-semibold">
                        {transcript.roomName}
                      </h2>
                      <p className="mt-1 text-xs text-zinc-500">
                        {formatSummaryDate(transcript)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-xs font-semibold text-zinc-200 transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!canCopy}
                        onClick={() => void handleCopySummary(transcript)}
                        type="button"
                      >
                        <Copy className="size-3.5" />
                        {copiedId === transcript.id ? "Copied" : "Copy"}
                      </button>
                      <button
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 text-xs font-semibold text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={deletingId === transcript.id}
                        onClick={() => void deleteSummary(transcript.id)}
                        type="button"
                      >
                        <Trash2 className="size-3.5" />
                        {deletingId === transcript.id ? "Deleting" : "Delete"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 p-4">
                    <MeetingSummaryCard
                      description={`Meeting ID ${transcript.meetingId}`}
                      summary={transcript.summary}
                      title="Summary"
                    />

                    {transcript.errorMessage ? (
                      <section className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
                        {transcript.errorMessage}
                      </section>
                    ) : null}

                    {transcript.transcript ? (
                      <section className="rounded-2xl border border-white/10 bg-black/20">
                        <button
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-300 transition hover:bg-white/[0.035]"
                          onClick={() => toggleTranscript(transcript.id)}
                          type="button"
                        >
                          <span>Transcript</span>
                          {isTranscriptOpen ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </button>
                        {isTranscriptOpen ? (
                          <p className="max-h-72 overflow-auto border-t border-white/[0.08] px-4 py-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                            {transcript.transcript}
                          </p>
                        ) : null}
                      </section>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </main>
  );
}
