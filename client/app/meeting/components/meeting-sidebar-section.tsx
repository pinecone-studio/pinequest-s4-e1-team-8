"use client";

import { useSidebar } from "@/components/sidebar/sidebar-context";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ConnectionState } from "livekit-client";
import {
  ChevronDown,
  ChevronRight,
  Headphones,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMeetingChannels } from "../hooks/use-meeting-channels";
import { getMeetingRoomHref } from "../utils/meeting-room-url";
import { useMeetingSession } from "./meeting-session-provider";

export const MeetingSidebarSection = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { collapsed } = useSidebar();
  const {
    activeSession,
    activeSessionRoomName,
    connectionState,
    participants,
  } = useMeetingSession();
  const { channels } = useMeetingChannels();
  const activeMeetingId = searchParams.get("meetingId");
  const activeRoomName = searchParams.get("roomName");
  const isMeetingActive = pathname === "/meeting";
  const isSessionConnected = connectionState === ConnectionState.Connected;
  const connectedRoomKey =
    activeSession && activeSessionRoomName
      ? `${activeSession.meetingId}:${activeSessionRoomName}`
      : "";
  const [isSectionExpanded, setIsSectionExpanded] = useState(true);
  const visibleChannels = useMemo(() => {
    const activeSessionRoom =
      activeSession && activeSessionRoomName
        ? {
            createdAt: 0,
            id: activeSession.meetingId,
            meetingId: activeSession.meetingId,
            roomName: activeSessionRoomName,
          }
        : null;
    const channelsWithSession =
      activeSessionRoom &&
      !channels.some(
        (room) =>
          room.meetingId === activeSessionRoom.meetingId &&
          room.roomName === activeSessionRoom.roomName,
      )
        ? [activeSessionRoom, ...channels]
        : channels;

    if (!isMeetingActive || !activeMeetingId || !activeRoomName) {
      return channelsWithSession;
    }

    const hasActiveRoom = channelsWithSession.some(
      (room) =>
        room.meetingId === activeMeetingId && room.roomName === activeRoomName,
    );

    if (hasActiveRoom) return channelsWithSession;

    return [
      {
        createdAt: 0,
        id: activeMeetingId,
        meetingId: activeMeetingId,
        roomName: activeRoomName,
      },
      ...channelsWithSession,
    ];
  }, [
    activeMeetingId,
    activeRoomName,
    activeSession,
    activeSessionRoomName,
    channels,
    isMeetingActive,
  ]);

  useEffect(() => {
    if (isMeetingActive || activeSession) {
      setIsSectionExpanded(true);
    }
  }, [activeSession, isMeetingActive]);

  return (
    <li>
      {collapsed ? (
        <Link
          className={cn(
            "relative flex items-center justify-center rounded-[14px] px-0 py-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground/80 focus-visible:ring-2 focus-visible:ring-violet-500/40",
            isMeetingActive &&
              "bg-[#7c3aed] text-white shadow-[0_4px_24px_-4px_rgba(124,58,237,0.55)]",
          )}
          href="/meeting"
          title="Meeting"
        >
          <Headphones
            className={cn(
              "size-[18px] shrink-0 stroke-[1.75]",
              isMeetingActive ? "text-white" : "text-muted-foreground",
            )}
          />
        </Link>
      ) : (
        <div className="group/meeting relative flex items-center">
          <button
            aria-expanded={isSectionExpanded}
            className={cn(
              "relative flex min-w-0 flex-1 items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-[13px] font-medium transition-colors",
              isMeetingActive
                ? "bg-[#7c3aed] text-white shadow-[0_4px_24px_-4px_rgba(124,58,237,0.55)]"
                : "text-muted-foreground hover:bg-accent hover:text-foreground/80",
              "focus-visible:ring-2 focus-visible:ring-violet-500/40",
            )}
            onClick={() => setIsSectionExpanded((value) => !value)}
            type="button"
          >
            <Headphones
              className={cn(
                "size-[17px] shrink-0 stroke-[1.75]",
                isMeetingActive ? "text-white" : "text-muted-foreground",
              )}
            />
            <span className="min-w-0 flex-1 text-left">Meeting</span>
            {isSectionExpanded ? (
              <ChevronDown className="size-3 shrink-0 text-muted-foreground/60" />
            ) : (
              <ChevronRight className="size-3 shrink-0 text-muted-foreground/60" />
            )}
          </button>
        </div>
      )}

      {!collapsed && isSectionExpanded && (
        <div className="mt-1 space-y-0.5 pl-8">
          {/* Static voice channels only. Do not request LiveKit tokens or create
          backend rooms from this sidebar; channel clicks only navigate. */}
          {visibleChannels.map((room) => {
            const roomKey = `${room.meetingId}:${room.roomName}`;
            const isRoomActive =
              isMeetingActive &&
              activeMeetingId === room.meetingId &&
              activeRoomName === room.roomName;
            const isConnectedRoom = connectedRoomKey === roomKey;
            const shouldShowMembers = isConnectedRoom && participants.length > 0;

            return (
              <div
                className="group/channel min-w-0"
                key={room.id}
              >
                <div className="flex min-w-0 items-center gap-1">
                  <Link
                    className={cn(
                      "relative flex min-w-0 flex-1 items-center gap-1.5 rounded-[10px] px-2 py-1.5 text-[12px] font-medium leading-none transition-colors focus-visible:ring-2 focus-visible:ring-violet-500/40",
                      isRoomActive
                        ? "bg-violet-100 dark:bg-violet-500/15 text-foreground/90 ring-1 ring-violet-400 dark:ring-violet-500/25"
                        : "text-muted-foreground hover:bg-accent hover:text-muted-foreground",
                      isConnectedRoom &&
                        "bg-violet-100 dark:bg-violet-500/10 text-foreground/90 ring-1 ring-emerald-400/20",
                    )}
                    href={getMeetingRoomHref(room)}
                  >
                    <Volume2
                      className={cn(
                        "size-3.5 shrink-0 stroke-[1.75]",
                        isRoomActive ? "text-violet-800 dark:text-violet-300" : "text-muted-foreground",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {room.roomName}
                    </span>
                    {isConnectedRoom && isSessionConnected ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded bg-emerald-100 dark:bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-400/20">
                        <span className="size-1.5 rounded-full bg-emerald-400" />
                        LIVE ({participants.length})
                      </span>
                    ) : null}
                  </Link>
                </div>
                {shouldShowMembers ? (
                  <div className="mt-1 space-y-0.5 pl-3">
                    {participants.map((participant) => {
                      const initial =
                        participant.displayName.slice(0, 1).toUpperCase() || "U";

                      return (
                        <div
                          className={cn(
                            "flex min-w-0 items-center gap-2 rounded-[10px] px-2 py-1 text-[11px] text-muted-foreground transition-colors",
                            participant.isSpeaking &&
                              "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-400/20",
                          )}
                          key={participant.identity}
                        >
                          <Avatar
                            className={cn(
                              "size-5 ring-1 ring-violet-400/20 transition-colors after:hidden",
                              participant.isSpeaking &&
                                "ring-2 ring-emerald-400/50",
                            )}
                            size="sm"
                          >
                            {participant.avatarUrl ? (
                              <AvatarImage
                                alt=""
                                src={participant.avatarUrl}
                              />
                            ) : null}
                            <AvatarFallback
                              className={cn(
                                "bg-violet-100 dark:bg-violet-500/15 text-[10px] font-semibold text-violet-900 dark:text-violet-100",
                                participant.isSpeaking &&
                                  "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-100",
                              )}
                            >
                              {initial}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 flex-1 truncate">
                            {participant.displayName}
                          </span>
                          {participant.isSpeaking ? (
                            <span
                              aria-label="Speaking"
                              className="size-2 shrink-0 rounded-full bg-emerald-400"
                            />
                          ) : null}
                          <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
                            {participant.isMicrophoneEnabled ? (
                              <Mic
                                aria-label="Microphone on"
                                className="size-3 text-emerald-800 dark:text-emerald-300"
                              />
                            ) : (
                              <MicOff
                                aria-label="Microphone muted"
                                className="size-3 text-muted-foreground"
                              />
                            )}
                            {participant.isCameraEnabled ? (
                              <Video
                                aria-label="Camera on"
                                className="size-3 text-violet-800 dark:text-violet-300"
                              />
                            ) : (
                              <VideoOff
                                aria-label="Camera off"
                                className="size-3 text-muted-foreground"
                              />
                            )}
                          </span>
                          {participant.isLocal ? (
                            <span className="shrink-0 rounded bg-emerald-100 dark:bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-emerald-800 dark:text-emerald-200">
                              You
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </li>
  );
};
