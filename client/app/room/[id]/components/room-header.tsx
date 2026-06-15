import {
  ArrowLeft,
  Check,
  LayoutGrid,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import type { PendingParticipant } from "../types";

type RoomHeaderProps = {
  locationLabel: string;
  onApproveParticipant: () => void;
  onRejectParticipant: () => void;
  pendingParticipant: PendingParticipant | null;
  roomName: string;
};

export const RoomHeader = ({
  locationLabel,
  onApproveParticipant,
  onRejectParticipant,
  pendingParticipant,
  roomName,
}: RoomHeaderProps) => {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 px-1 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          href="/meetings"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-zinc-900">
            {roomName}
          </h1>
          <p className="truncate text-xs text-zinc-500">{locationLabel}</p>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center">
        {pendingParticipant ? (
          <div className="flex items-center gap-3 rounded-full border border-zinc-200 bg-white/80 py-1.5 pl-4 pr-2 shadow-sm backdrop-blur">
            <span className="truncate text-sm text-zinc-900">
              <span className="font-semibold">{pendingParticipant.name}</span>{" "}
              wants to join the meeting
            </span>
            <button
              aria-label="Reject participant"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-100"
              onClick={onRejectParticipant}
              type="button"
            >
              <X className="size-3.5" />
            </button>
            <button
              aria-label="Approve participant"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-800"
              onClick={onApproveParticipant}
              type="button"
            >
              <Check className="size-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          type="button"
        >
          <Sparkles className="size-4" />
          Upgrade plan
        </button>
        <button
          aria-label="Toggle layout"
          className="flex size-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900"
          type="button"
        >
          <LayoutGrid className="size-4" />
        </button>
        <button
          aria-label="Room settings"
          className="flex size-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900"
          type="button"
        >
          <Settings className="size-4" />
        </button>
      </div>
    </header>
  );
};
