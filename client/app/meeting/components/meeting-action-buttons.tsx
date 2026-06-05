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
      className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      disabled={disabled}
      onClick={() => onAction("create")}
      type="button"
    >
      {loadingAction === "create" ? "Creating..." : "Create room"}
    </button>
    <button
      className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-60"
      disabled={disabled}
      onClick={() => onAction("join")}
      type="button"
    >
      {loadingAction === "join" ? "Joining..." : "Join room"}
    </button>
  </div>
);
