"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { MeetingRoomListItem } from "../types/meeting-room.types";

type MeetingChannelPresenceValue = {
  joinedChannelKey: string;
  joinedChannelParticipants: MeetingChannelParticipant[];
  clearJoinedChannel: () => void;
  setJoinedChannel: (
    channel: Pick<MeetingRoomListItem, "meetingId" | "roomName">,
  ) => void;
  setJoinedChannelParticipants: (
    participants: MeetingChannelParticipant[],
  ) => void;
};

const MeetingChannelPresenceContext =
  createContext<MeetingChannelPresenceValue | null>(null);

export type MeetingChannelParticipant = {
  displayName: string;
  identity: string;
  isLocal: boolean;
  isScreenSharing: boolean;
};

export const getMeetingChannelKey = (
  channel: Pick<MeetingRoomListItem, "meetingId" | "roomName">,
) => `${channel.meetingId}:${channel.roomName}`;

export const MeetingChannelPresenceProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [joinedChannelKey, setJoinedChannelKey] = useState("");
  const [joinedChannelParticipants, setJoinedChannelParticipants] = useState<
    MeetingChannelParticipant[]
  >([]);

  const setJoinedChannel = useCallback(
    (channel: Pick<MeetingRoomListItem, "meetingId" | "roomName">) => {
      setJoinedChannelKey(getMeetingChannelKey(channel));
    },
    [],
  );

  const clearJoinedChannel = useCallback(() => {
    setJoinedChannelKey("");
    setJoinedChannelParticipants([]);
  }, []);

  const value = useMemo(
    () => ({
      clearJoinedChannel,
      joinedChannelKey,
      joinedChannelParticipants,
      setJoinedChannel,
      setJoinedChannelParticipants,
    }),
    [
      clearJoinedChannel,
      joinedChannelKey,
      joinedChannelParticipants,
      setJoinedChannel,
      setJoinedChannelParticipants,
    ],
  );

  return (
    <MeetingChannelPresenceContext.Provider value={value}>
      {children}
    </MeetingChannelPresenceContext.Provider>
  );
};

export const useMeetingChannelPresence = () => {
  const context = useContext(MeetingChannelPresenceContext);

  if (!context) {
    throw new Error(
      "useMeetingChannelPresence must be used within MeetingChannelPresenceProvider",
    );
  }

  return context;
};
