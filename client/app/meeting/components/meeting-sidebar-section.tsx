"use client";

import { useUser } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/sidebar/sidebar-context";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Headphones,
  MoreHorizontal,
  Plus,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  getMeetingChannelKey,
  useMeetingChannelPresence,
} from "./meeting-channel-presence-provider";
import { useMeetingChannels } from "../hooks/use-meeting-channels";
import type { MeetingRoomListItem } from "../types/meeting-room.types";
import { getMeetingRoomHref } from "../utils/meeting-room-url";

type ChannelDialogState =
  | {
      mode: "create";
      room?: never;
    }
  | {
      mode: "rename";
      room: MeetingRoomListItem;
    }
  | null;

export const MeetingSidebarSection = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSignedIn } = useUser();
  const { collapsed } = useSidebar();
  const { joinedChannelKey, joinedChannelParticipants } =
    useMeetingChannelPresence();
  const { channels, createChannel, deleteChannel, renameChannel } =
    useMeetingChannels();
  const activeMeetingId = searchParams.get("meetingId");
  const activeRoomName = searchParams.get("roomName");
  const isMeetingActive = pathname === "/meeting";
  const [isSectionExpanded, setIsSectionExpanded] = useState(true);
  const [dialogState, setDialogState] = useState<ChannelDialogState>(null);
  const [channelName, setChannelName] = useState("");
  const visibleChannels = useMemo(() => {
    if (!isMeetingActive || !activeMeetingId || !activeRoomName) {
      return channels;
    }

    const hasActiveRoom = channels.some(
      (room) =>
        room.meetingId === activeMeetingId && room.roomName === activeRoomName,
    );

    if (hasActiveRoom) return channels;

    return [
      {
        createdAt: 0,
        id: activeMeetingId,
        meetingId: activeMeetingId,
        roomName: activeRoomName,
      },
      ...channels,
    ];
  }, [activeMeetingId, activeRoomName, channels, isMeetingActive]);

  useEffect(() => {
    if (isMeetingActive) {
      setIsSectionExpanded(true);
    }
  }, [isMeetingActive]);

  const closeDialog = () => {
    setDialogState(null);
    setChannelName("");
  };

  const openCreateDialog = () => {
    // TODO: Gate channel creation by workspace admin/owner permissions.
    setDialogState({ mode: "create" });
    setChannelName("");
  };

  const openRenameDialog = (room: MeetingRoomListItem) => {
    // TODO: Gate channel rename by workspace admin/owner permissions.
    setDialogState({ mode: "rename", room });
    setChannelName(room.roomName);
  };

  const handleDeleteChannel = (room: MeetingRoomListItem) => {
    // TODO: Gate channel deletion by workspace admin/owner permissions.
    deleteChannel(room.id);

    if (
      isMeetingActive &&
      activeMeetingId === room.meetingId &&
      activeRoomName === room.roomName
    ) {
      router.push("/meeting");
    }
  };

  const handleDialogSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!channelName.trim() || !dialogState) return;

    if (dialogState.mode === "create") {
      createChannel(channelName);
      closeDialog();
      return;
    }

    renameChannel(dialogState.room.id, channelName);

    if (
      isMeetingActive &&
      activeMeetingId === dialogState.room.meetingId &&
      activeRoomName === dialogState.room.roomName
    ) {
      router.replace(
        getMeetingRoomHref({
          ...dialogState.room,
          roomName: channelName.trim(),
        }),
      );
    }

    closeDialog();
  };

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
          {isSignedIn ? (
            <button
              aria-label="Create meeting channel"
              className="ml-1 flex size-7 shrink-0 items-center justify-center rounded-xl text-[#6b6b73] opacity-0 transition hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-violet-500/40 group-hover/meeting:opacity-100 focus-visible:opacity-100"
              onClick={openCreateDialog}
              type="button"
            >
              <Plus className="size-3.5" />
            </button>
          ) : null}
        </div>
      )}

      {!collapsed && isSectionExpanded && (
        <div className="mt-1 space-y-0.5 pl-8">
          {/* Static voice channels only. Do not request LiveKit tokens or create
          backend rooms from this sidebar; channel clicks only navigate. */}
          {visibleChannels.map((room) => {
            const isRoomActive =
              isMeetingActive &&
              activeMeetingId === room.meetingId &&
              activeRoomName === room.roomName;
            const isCurrentUserInside =
              joinedChannelKey === getMeetingChannelKey(room);
            const shouldShowMembers = isRoomActive && isCurrentUserInside;
            const hasLiveStream =
              isCurrentUserInside &&
              joinedChannelParticipants.some(
                (participant) => participant.isScreenSharing,
              );

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
                    {hasLiveStream ? (
                      <span className="shrink-0 rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white">
                        LIVE
                      </span>
                    ) : null}
                    {isCurrentUserInside ? (
                      <span
                        aria-label="You are in this channel"
                        className="size-1.5 shrink-0 rounded-full bg-emerald-400"
                      />
                    ) : null}
                  </Link>
                  {isSignedIn ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`${room.roomName} channel actions`}
                        className="flex size-7 shrink-0 items-center justify-center rounded-xl text-[#6b6b73] opacity-0 transition hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-violet-500/40 group-hover/channel:opacity-100 data-[popup-open]:opacity-100"
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-36 border border-white/10 bg-[#1b1b20] text-[#dedee6]"
                      >
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => openRenameDialog(room)}
                        >
                          Rename channel
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-red-200 focus:text-red-100"
                          onClick={() => handleDeleteChannel(room)}
                        >
                          Delete channel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
                {shouldShowMembers ? (
                  <div className="mt-1 space-y-0.5 pl-3">
                    {joinedChannelParticipants.map((participant) => {
                      const initial =
                        participant.displayName.slice(0, 1).toUpperCase() || "U";

                      return (
                        <div
                          className="flex min-w-0 items-center gap-2 rounded-[10px] px-2 py-1 text-[11px] text-[#8e8e93]"
                          key={participant.identity}
                        >
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[10px] font-semibold text-violet-100 ring-1 ring-violet-400/20">
                            {initial}
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {participant.displayName}
                          </span>
                          {participant.isScreenSharing ? (
                            <span className="shrink-0 rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white">
                              LIVE
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

      {dialogState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
          <form
            className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-[#17151f] p-5 shadow-2xl shadow-black/40"
            onSubmit={handleDialogSubmit}
          >
            <div>
              <h2 className="text-base font-semibold text-white">
                {dialogState.mode === "create"
                  ? "Create meeting channel"
                  : "Rename meeting channel"}
              </h2>
            </div>
            <label className="block space-y-1 text-sm font-medium text-zinc-300">
              <span>Channel name</span>
              <input
                autoFocus
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-400"
                onChange={(event) => setChannelName(event.target.value)}
                value={channelName}
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                onClick={closeDialog}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-2xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-400 disabled:opacity-60"
                disabled={!channelName.trim()}
                type="submit"
              >
                {dialogState.mode === "create" ? "Create" : "Rename"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </li>
  );
};
