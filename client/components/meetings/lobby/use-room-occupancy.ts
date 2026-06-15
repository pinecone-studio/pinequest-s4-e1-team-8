"use client";

import { useEffect, useState } from "react";
import {
  getMeetingRoomParticipants,
  type MeetingRoomParticipantSummary,
} from "@/app/meeting/api/get-meeting-room-participants";

export type RoomOccupancy = {
  isLoading: boolean;
  participants: MeetingRoomParticipantSummary[];
};

export const getOccupancySubtitle = (count: number) => {
  if (count <= 0) return "No one else is here";
  if (count === 1) return "1 other person is already in this meeting";
  return `${count} other people are already in this meeting`;
};

const EMPTY_PARTICIPANTS: MeetingRoomParticipantSummary[] = [];

export const useRoomOccupancy = (roomName: string): RoomOccupancy => {
  const [participants, setParticipants] = useState<MeetingRoomParticipantSummary[]>(
    EMPTY_PARTICIPANTS,
  );
  const [isLoading, setIsLoading] = useState(Boolean(roomName));

  useEffect(() => {
    if (!roomName) {
      setParticipants(EMPTY_PARTICIPANTS);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    void getMeetingRoomParticipants(roomName)
      .then((response) => {
        if (isCancelled) return;
        setParticipants(response.participants);
      })
      .catch(() => {
        if (isCancelled) return;
        setParticipants(EMPTY_PARTICIPANTS);
      })
      .finally(() => {
        if (isCancelled) return;
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [roomName]);

  return { isLoading, participants };
};
