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
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-60"
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
      className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      disabled={isLoading || isStopped}
      onClick={onStart}
      type="button"
    >
      {isLoading ? "Starting..." : "Start Recording"}
    </button>
  );
};
