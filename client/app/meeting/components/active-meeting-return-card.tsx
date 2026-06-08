"use client";

import { useSidebar } from "@/components/sidebar/sidebar-context";
import { cn } from "@/lib/utils";
import { ConnectionState } from "livekit-client";
import { Mic } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMeetingSession } from "./meeting-session-provider";

export function ActiveMeetingReturnCard() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const {
    activeSession,
    activeSessionHref,
    activeSessionRoomName,
    connectionState,
    participants,
  } = useMeetingSession();
  const isConnected = connectionState === ConnectionState.Connected;

  if (
    collapsed ||
    pathname === "/meeting" ||
    !isConnected ||
    !activeSession ||
    !activeSessionHref ||
    !activeSessionRoomName
  ) {
    return null;
  }

  return (
    <div className="border-t border-white/[0.06] pt-3">
      <Link
        className={cn(
          "block rounded-2xl border border-white/10 bg-[#17151f] p-3 text-left transition hover:border-violet-400/30 hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-violet-500/40",
        )}
        href={activeSessionHref}
      >
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-100 ring-1 ring-violet-400/20">
            <Mic className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {activeSessionRoomName}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-[#8e8e93]">
              Connected • {participants.length} participant
              {participants.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <span className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-500">
          Return to Meeting
        </span>
      </Link>
    </div>
  );
}
