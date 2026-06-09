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
import { useMeetingRoomsPresence } from "../hooks/use-meeting-rooms-presence";
import { getMeetingRoomHref } from "../utils/meeting-room-url";
import {
  useMeetingSession,
  type MeetingSessionParticipant,
} from "./meeting-session-provider";

type SidebarPresenceMember = Pick<
  MeetingSessionParticipant,
  | "avatarUrl"
  | "displayName"
  | "identity"
  | "isCameraEnabled"
  | "isLocal"
  | "isMicrophoneEnabled"
  | "isSpeaking"
>;

const toSidebarPresenceMembers = (
  participants: MeetingSessionParticipant[],
): SidebarPresenceMember[] => participants;

const toSidebarPresenceMembersFromPreview = (
  participants: {
    identity: string;
    isCameraEnabled: boolean;
    isMicrophoneEnabled: boolean;
    name: string;
  }[],
): SidebarPresenceMember[] =>
  participants.map((participant) => ({
    avatarUrl: undefined,
    displayName: participant.name,
    identity: participant.identity,
    isCameraEnabled: participant.isCameraEnabled,
    isLocal: false,
    isMicrophoneEnabled: participant.isMicrophoneEnabled,
    isSpeaking: false,
  }));

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
  const getRoomPresence = useMeetingRoomsPresence(visibleChannels);

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
            "relative flex items-center justify-center rounded-[14px] px-0 py-2.5 text-[#8e8e93] transition-colors hover:bg-white/[0.04] hover:text-[#c4c4cc] focus-visible:ring-2 focus-visible:ring-violet-500/40",
            isMeetingActive &&
              "bg-[#7c3aed] text-white shadow-[0_4px_24px_-4px_rgba(124,58,237,0.55)]",
          )}
          href="/meeting"
          title="Meeting"
        >
          <Headphones
            className={cn(
              "size-[18px] shrink-0 stroke-[1.75]",
              isMeetingActive ? "text-white" : "text-[#6b6b73]",
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
                : "text-[#8e8e93] hover:bg-white/[0.04] hover:text-[#c4c4cc]",
              "focus-visible:ring-2 focus-visible:ring-violet-500/40",
            )}
            onClick={() => setIsSectionExpanded((value) => !value)}
            type="button"
          >
            <Headphones
              className={cn(
                "size-[17px] shrink-0 stroke-[1.75]",
                isMeetingActive ? "text-white" : "text-[#6b6b73]",
              )}
            />
            <span className="min-w-0 flex-1 text-left">Meeting</span>
            {isSectionExpanded ? (
              <ChevronDown className="size-3 shrink-0 text-[#6b6b73]/60" />
            ) : (
              <ChevronRight className="size-3 shrink-0 text-[#6b6b73]/60" />
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
            const presence = getRoomPresence(room);

            // Prefer the live LiveKit session's participant list (richer,
            // real-time speaking state) when we're connected to this room;
            // otherwise fall back to the presence preview fetched from the
            // backend so the channel can show who's inside before joining.
            const isUsingLiveSession = isConnectedRoom && isSessionConnected;
            const members: SidebarPresenceMember[] = isUsingLiveSession
              ? toSidebarPresenceMembers(participants)
              : toSidebarPresenceMembersFromPreview(presence.participants);
            const liveCount = isUsingLiveSession
              ? participants.length
              : presence.count;
            const isLive = isUsingLiveSession || liveCount > 0;
            const shouldShowMembers =
              members.length > 0 && (isUsingLiveSession || isRoomActive);
            const presenceStatusMessage =
              !shouldShowMembers && isRoomActive
                ? presence.error
                  ? "Presence unavailable"
                  : presence.isLoading
                    ? "Checking participants..."
                    : presence.hasLoaded
                      ? "No one in channel"
                      : null
                : null;

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
                        ? "bg-violet-500/15 text-[#dedee6] ring-1 ring-violet-500/25"
                        : "text-[#6b6b73] hover:bg-white/[0.04] hover:text-[#a0a0aa]",
                      isConnectedRoom &&
                        "bg-violet-500/10 text-[#dedee6] ring-1 ring-emerald-400/20",
                    )}
                    href={getMeetingRoomHref(room)}
                  >
                    <Volume2
                      className={cn(
                        "size-3.5 shrink-0 stroke-[1.75]",
                        isRoomActive ? "text-violet-300" : "text-[#5c5c66]",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {room.roomName}
                    </span>
                    {isLive ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-200 ring-1 ring-emerald-400/20">
                        <span className="size-1.5 rounded-full bg-emerald-400" />
                        LIVE ({liveCount})
                      </span>
                    ) : null}
                  </Link>
                </div>
                {shouldShowMembers ? (
                  <div className="mt-1 space-y-0.5 pl-3">
                    {members.map((member) => {
                      const initial =
                        member.displayName.slice(0, 1).toUpperCase() || "U";

                      return (
                        <div
                          className={cn(
                            "flex min-w-0 items-center gap-2 rounded-[10px] px-2 py-1 text-[11px] text-[#8e8e93] transition-colors",
                            member.isSpeaking &&
                              "bg-emerald-500/10 text-emerald-100 ring-1 ring-emerald-400/20",
                          )}
                          key={member.identity}
                        >
                          <Avatar
                            className={cn(
                              "size-5 ring-1 ring-violet-400/20 transition-colors after:hidden",
                              member.isSpeaking &&
                                "ring-2 ring-emerald-400/50",
                            )}
                            size="sm"
                          >
                            {member.avatarUrl ? (
                              <AvatarImage
                                alt=""
                                src={member.avatarUrl}
                              />
                            ) : null}
                            <AvatarFallback
                              className={cn(
                                "bg-violet-500/15 text-[10px] font-semibold text-violet-100",
                                member.isSpeaking &&
                                  "bg-emerald-500/20 text-emerald-100",
                              )}
                            >
                              {initial}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 flex-1 truncate">
                            {member.displayName}
                          </span>
                          {member.isSpeaking ? (
                            <span
                              aria-label="Speaking"
                              className="size-2 shrink-0 rounded-full bg-emerald-400"
                            />
                          ) : null}
                          <span className="flex shrink-0 items-center gap-1 text-[#6b6b73]">
                            {member.isMicrophoneEnabled ? (
                              <Mic
                                aria-label="Microphone on"
                                className="size-3 text-emerald-300"
                              />
                            ) : (
                              <MicOff
                                aria-label="Microphone muted"
                                className="size-3 text-[#6b6b73]"
                              />
                            )}
                            {member.isCameraEnabled ? (
                              <Video
                                aria-label="Camera on"
                                className="size-3 text-violet-300"
                              />
                            ) : (
                              <VideoOff
                                aria-label="Camera off"
                                className="size-3 text-[#6b6b73]"
                              />
                            )}
                          </span>
                          {member.isLocal ? (
                            <span className="shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-emerald-200">
                              You
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : presenceStatusMessage ? (
                  <div className="mt-1 truncate px-2 pl-3 text-[11px] text-[#6b6b73]">
                    {presenceStatusMessage}
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
