"use client";

import { useMeetingTranscript } from "../hooks/use-meeting-transcript";
import { MeetingSummaryCard } from "./meeting-summary-card";

type TranscriptPanelProps = {
  transcriptionId?: string;
};

export const TranscriptPanel = ({ transcriptionId }: TranscriptPanelProps) => {
  const { error, isLoading, refreshTranscript, transcript } =
    useMeetingTranscript(transcriptionId);

  if (!transcriptionId) return null;

  return (
    <section className="space-y-3 rounded-3xl border border-white/10 bg-[#11101a] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Transcript</h3>
          <p className="text-xs text-zinc-400">
            {transcript?.status ?? "loading"}
          </p>
        </div>
        <button
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
          disabled={isLoading}
          onClick={() => void refreshTranscript()}
          type="button"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? <p className="text-sm text-red-200">{error}</p> : null}
      {isLoading && !transcript ? (
        <p className="text-sm text-zinc-400">Loading transcript...</p>
      ) : null}
      {transcript?.errorMessage ? (
        <p className="text-sm text-red-200">{transcript.errorMessage}</p>
      ) : null}
      {transcript?.transcript ? (
        <div className="space-y-1">
          <h4 className="text-xs font-medium uppercase text-zinc-500">
            Transcript text
          </h4>
          <p className="max-h-56 overflow-auto whitespace-pre-wrap text-sm text-zinc-200">
            {transcript.transcript}
          </p>
        </div>
      ) : null}
      <MeetingSummaryCard summary={transcript?.summary} />
    </section>
  );
};
