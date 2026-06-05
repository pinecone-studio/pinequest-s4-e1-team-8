"use client";

import { useMeetingTranscript } from "../hooks/use-meeting-transcript";

type TranscriptPanelProps = {
  transcriptionId?: string;
};

export const TranscriptPanel = ({ transcriptionId }: TranscriptPanelProps) => {
  const { error, isLoading, refreshTranscript, transcript } =
    useMeetingTranscript(transcriptionId);

  if (!transcriptionId) return null;

  return (
    <section className="space-y-3 rounded-md border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-950">Transcript</h3>
          <p className="text-xs text-zinc-500">
            {transcript?.status ?? "loading"}
          </p>
        </div>
        <button
          className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-900 disabled:opacity-60"
          disabled={isLoading}
          onClick={() => void refreshTranscript()}
          type="button"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {isLoading && !transcript ? (
        <p className="text-sm text-zinc-500">Loading transcript...</p>
      ) : null}
      {transcript?.errorMessage ? (
        <p className="text-sm text-red-600">{transcript.errorMessage}</p>
      ) : null}
      {transcript?.transcript ? (
        <div className="space-y-1">
          <h4 className="text-xs font-medium uppercase text-zinc-500">
            Transcript text
          </h4>
          <p className="whitespace-pre-wrap text-sm text-zinc-800">
            {transcript.transcript}
          </p>
        </div>
      ) : null}
      {transcript?.summary ? (
        <div className="space-y-1">
          <h4 className="text-xs font-medium uppercase text-zinc-500">
            AI summary
          </h4>
          <p className="whitespace-pre-wrap text-sm text-zinc-800">
            {transcript.summary}
          </p>
        </div>
      ) : null}
    </section>
  );
};
