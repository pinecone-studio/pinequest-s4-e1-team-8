"use client";

import { RoomEvent, type Room, type RemoteParticipant } from "livekit-client";
import { ArrowLeft, Check, Copy, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getParticipantDisplayName } from "./participant-tile";

type JoinNotification = {
  identity: string;
  name: string;
};

type MeetingRoomHeaderProps = {
  meetingId: string;
  meetingLinkPath: string;
  room: Room | null;
  roomName: string;
};

export const MeetingRoomHeader = ({
  meetingId,
  meetingLinkPath,
  room,
  roomName,
}: MeetingRoomHeaderProps) => {
  const [joinNotifications, setJoinNotifications] = useState<JoinNotification[]>([]);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  useEffect(() => {
    if (!room) return;

    const handleParticipantConnected = (participant: RemoteParticipant) => {
      setJoinNotifications((current) => [
        ...current,
        {
          identity: participant.identity,
          name: getParticipantDisplayName(participant),
        },
      ]);
    };

    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);

    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
    };
  }, [room]);

  useEffect(() => {
    if (!isLinkCopied) return;

    const timeout = window.setTimeout(() => setIsLinkCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [isLinkCopied]);

  const dismissNotification = (identity: string) => {
    setJoinNotifications((current) =>
      current.filter((notification) => notification.identity !== identity),
    );
  };

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;

    try {
      await navigator.clipboard.writeText(`${window.location.origin}${meetingLinkPath}`);
      setIsLinkCopied(true);
    } catch {
      setIsLinkCopied(false);
    }
  };

  const activeNotification = joinNotifications[0] ?? null;

  return (
    <header className="flex shrink-0 items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 shadow-sm transition-all duration-200 hover:bg-zinc-50"
          href="/meetings"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-zinc-900">{roomName}</h1>
          <p className="truncate text-xs text-zinc-500">Meeting ID · {meetingId}</p>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center">
        {activeNotification ? (
          <div className="flex items-center gap-3 rounded-full border border-zinc-200 bg-white/80 py-1.5 pl-4 pr-2 shadow-sm backdrop-blur transition-all duration-200">
            <span className="truncate text-sm text-zinc-900">
              <span className="font-semibold">{activeNotification.name}</span> joined the
              meeting
            </span>
            <button
              aria-label="Dismiss notification"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 transition-all duration-200 hover:bg-red-100"
              onClick={() => dismissNotification(activeNotification.identity)}
              type="button"
            >
              <X className="size-3.5" />
            </button>
            <button
              aria-label="Acknowledge notification"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-all duration-200 hover:bg-zinc-800"
              onClick={() => dismissNotification(activeNotification.identity)}
              type="button"
            >
              <Check className="size-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="relative flex shrink-0 items-center gap-2">
        <button
          className="inline-flex h-10 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm transition-all duration-200 hover:bg-zinc-50"
          onClick={() => void handleCopyLink()}
          type="button"
        >
          <Copy className="size-4" />
          Copy Meeting Link
        </button>
        {isLinkCopied ? (
          <span className="absolute -bottom-8 right-0 whitespace-nowrap rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white shadow-sm transition-all duration-200">
            Link copied
          </span>
        ) : null}
      </div>
    </header>
  );
};
