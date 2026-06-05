"use client";

type MeetingAction = "create" | "join";

type MeetingActionButtonsProps = {
  disabled: boolean;
  loadingAction: MeetingAction | null;
  onAction: (action: MeetingAction) => void;
};

export const MeetingActionButtons = ({
  disabled,
  loadingAction,
  onAction,
}: MeetingActionButtonsProps) => (
  <div className="flex flex-wrap gap-3">
    <button
      className="rounded-2xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-400 disabled:opacity-60"
      disabled={disabled}
      onClick={() => onAction("create")}
      type="button"
    >
      {loadingAction === "create" ? "Creating..." : "Create room"}
    </button>
    <button
      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
      disabled={disabled}
      onClick={() => onAction("join")}
      type="button"
    >
      {loadingAction === "join" ? "Joining..." : "Join room"}
    </button>
  </div>
);
