"use client";

import { useEffect, useRef, useState } from "react";
import {
  getMeetingRoomParticipants,
  type MeetingRoomParticipantSummary,
} from "../api/get-meeting-room-participants";
import type { MeetingRoomListItem } from "../types/meeting-room.types";
import { getMeetingRoomSelectionKey } from "../utils/meeting-room-url";

const PRESENCE_POLL_INTERVAL_MS = 12_000;

export type MeetingRoomPresence = {
  count: number;
  error: string | null;
  hasLoaded: boolean;
  isLoading: boolean;
  participants: MeetingRoomParticipantSummary[];
};

const EMPTY_PRESENCE: MeetingRoomPresence = {
  count: 0,
  error: null,
  hasLoaded: false,
  isLoading: false,
  participants: [],
};

type RoomIdentity = Pick<MeetingRoomListItem, "meetingId" | "roomName">;

// Polls LiveKit (via the backend) for who is currently inside each
// predefined room so the sidebar can show live presence without the
// current user having to join/connect to that room first.
export const useMeetingRoomsPresence = (rooms: RoomIdentity[]) => {
  const [presenceByRoomKey, setPresenceByRoomKey] = useState<
    Record<string, MeetingRoomPresence>
  >({});
  const roomsRef = useRef(rooms);

  const roomsKey = rooms.map(getMeetingRoomSelectionKey).join("|");

  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  useEffect(() => {
    if (!roomsKey) return;

    let isCancelled = false;

    const refreshPresence = async () => {
      const currentRooms = roomsRef.current;

      setPresenceByRoomKey((current) => {
        const loadingEntries = currentRooms.map((room) => {
          const roomKey = getMeetingRoomSelectionKey(room);
          const currentPresence = current[roomKey] ?? EMPTY_PRESENCE;

          return [
            roomKey,
            { ...currentPresence, error: null, isLoading: true },
          ] as const;
        });

        return {
          ...current,
          ...Object.fromEntries(loadingEntries),
        };
      });

      const entries = await Promise.all(
        currentRooms.map(async (room) => {
          const roomKey = getMeetingRoomSelectionKey(room);

          try {
            const response = await getMeetingRoomParticipants(room.meetingId);

            return [
              roomKey,
              {
                count: response.count,
                error: null,
                hasLoaded: true,
                isLoading: false,
                participants: response.participants,
              },
            ] as const;
          } catch (error) {
            return [
              roomKey,
              {
                count: 0,
                error:
                  error instanceof Error
                    ? error.message
                    : "Unable to load participants.",
                hasLoaded: true,
                isLoading: false,
                participants: [],
              },
            ] as const;
          }
        }),
      );

      if (isCancelled) return;

      setPresenceByRoomKey((current) => ({
        ...current,
        ...Object.fromEntries(entries),
      }));
    };

    void refreshPresence();
    const intervalId = window.setInterval(
      () => void refreshPresence(),
      PRESENCE_POLL_INTERVAL_MS,
    );

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [roomsKey]);

  return (room: RoomIdentity): MeetingRoomPresence =>
    presenceByRoomKey[getMeetingRoomSelectionKey(room)] ?? EMPTY_PRESENCE;
};
