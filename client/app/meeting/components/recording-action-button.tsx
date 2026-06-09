"use client";

type RecordingActionButtonProps = {
  isLoading: boolean;
  isRecordingActive: boolean;
  isStopped: boolean;
  onStart: () => void;
  onStop: () => void;
};

export const RecordingActionButton = ({
  isLoading,
  isRecordingActive,
  isStopped,
  onStart,
  onStop,
}: RecordingActionButtonProps) => {
  if (isRecordingActive) {
    return (
      <button
        className="rounded-2xl border border-red-300/30 bg-red-100 dark:bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-800 dark:text-red-100 transition hover:bg-red-500/25 disabled:opacity-60"
        disabled={isLoading}
        onClick={onStop}
        type="button"
      >
        {isLoading ? "Stopping..." : "Stop Recording"}
      </button>
    );
  }

  return (
    <button
      className="rounded-2xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-400 disabled:opacity-60"
      disabled={isLoading || isStopped}
      onClick={onStart}
      type="button"
    >
      {isLoading ? "Starting..." : "Start Recording"}
    </button>
  );
};
