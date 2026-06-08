"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { predefinedMeetingRooms } from "../predefined-meeting-rooms";
import type { MeetingRoomListItem } from "../types/meeting-room.types";

type StoredMeetingChannels = {
  customChannels: MeetingRoomListItem[];
  deletedDefaultIds: string[];
  renamedDefaults: Record<string, string>;
};

const MEETING_CHANNEL_STORAGE_KEY = "meeting-channels";

const emptyStoredChannels: StoredMeetingChannels = {
  customChannels: [],
  deletedDefaultIds: [],
  renamedDefaults: {},
};

const getSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "meeting-channel";

const getCustomChannelId = (channelName: string) =>
  `${getSlug(channelName)}-${Date.now().toString(36)}`;

const getMeetingId = (channelId: string) => `meeting-${channelId}`;

const readStoredChannels = () => {
  if (typeof window === "undefined") return emptyStoredChannels;

  try {
    const rawValue = window.localStorage.getItem(MEETING_CHANNEL_STORAGE_KEY);
    if (!rawValue) return emptyStoredChannels;

    const parsed = JSON.parse(rawValue) as Partial<StoredMeetingChannels>;

    return {
      customChannels: Array.isArray(parsed.customChannels)
        ? parsed.customChannels
        : [],
      deletedDefaultIds: Array.isArray(parsed.deletedDefaultIds)
        ? parsed.deletedDefaultIds
        : [],
      renamedDefaults:
        parsed.renamedDefaults && typeof parsed.renamedDefaults === "object"
          ? parsed.renamedDefaults
          : {},
    };
  } catch {
    return emptyStoredChannels;
  }
};

const writeStoredChannels = (value: StoredMeetingChannels) => {
  window.localStorage.setItem(MEETING_CHANNEL_STORAGE_KEY, JSON.stringify(value));
};

const getMergedChannels = (storedChannels: StoredMeetingChannels) => {
  const defaultChannels = predefinedMeetingRooms
    .filter((channel) => !storedChannels.deletedDefaultIds.includes(channel.id))
    .map((channel) => ({
      ...channel,
      roomName: storedChannels.renamedDefaults[channel.id] ?? channel.roomName,
    }));

  return [...defaultChannels, ...storedChannels.customChannels];
};

export const useMeetingChannels = () => {
  const [storedChannels, setStoredChannels] =
    useState<StoredMeetingChannels>(emptyStoredChannels);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Backend limitation: there is no channel-list endpoint yet, so custom
    // meeting channels and local default-channel edits are stored in
    // localStorage until the backend can own workspace channel state.
    setStoredChannels(readStoredChannels());
    setHydrated(true);
  }, []);

  const saveStoredChannels = useCallback((nextValue: StoredMeetingChannels) => {
    setStoredChannels(nextValue);
    writeStoredChannels(nextValue);
  }, []);

  const channels = useMemo(
    () =>
      hydrated
        ? getMergedChannels(storedChannels)
        : getMergedChannels(emptyStoredChannels),
    [hydrated, storedChannels],
  );

  const createChannel = useCallback(
    (channelName: string) => {
      const trimmedName = channelName.trim();
      if (!trimmedName) return;

      const id = getCustomChannelId(trimmedName);
      const channel = {
        createdAt: Date.now(),
        id,
        meetingId: getMeetingId(id),
        roomName: trimmedName,
      };

      saveStoredChannels({
        ...storedChannels,
        customChannels: [...storedChannels.customChannels, channel],
      });
    },
    [saveStoredChannels, storedChannels],
  );

  const renameChannel = useCallback(
    (channelId: string, nextName: string) => {
      const trimmedName = nextName.trim();
      if (!trimmedName) return;

      const isDefaultChannel = predefinedMeetingRooms.some(
        (channel) => channel.id === channelId,
      );

      if (isDefaultChannel) {
        saveStoredChannels({
          ...storedChannels,
          renamedDefaults: {
            ...storedChannels.renamedDefaults,
            [channelId]: trimmedName,
          },
        });
        return;
      }

      saveStoredChannels({
        ...storedChannels,
        customChannels: storedChannels.customChannels.map((channel) =>
          channel.id === channelId
            ? { ...channel, roomName: trimmedName }
            : channel,
        ),
      });
    },
    [saveStoredChannels, storedChannels],
  );

  const deleteChannel = useCallback(
    (channelId: string) => {
      const isDefaultChannel = predefinedMeetingRooms.some(
        (channel) => channel.id === channelId,
      );

      if (isDefaultChannel) {
        saveStoredChannels({
          ...storedChannels,
          deletedDefaultIds: Array.from(
            new Set([...storedChannels.deletedDefaultIds, channelId]),
          ),
        });
        return;
      }

      saveStoredChannels({
        ...storedChannels,
        customChannels: storedChannels.customChannels.filter(
          (channel) => channel.id !== channelId,
        ),
      });
    },
    [saveStoredChannels, storedChannels],
  );

  return {
    channels,
    createChannel,
    deleteChannel,
    renameChannel,
  };
};
