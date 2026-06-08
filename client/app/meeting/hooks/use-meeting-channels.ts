"use client";

import { predefinedMeetingRooms } from "../predefined-meeting-rooms";

// MVP: predefinedMeetingRooms is the single shared source of truth for the
// Meeting sidebar so every browser/device renders the same channel list.
// Custom channel create/rename/delete is intentionally not offered yet —
// there is no shared backend store for it, and persisting it in
// localStorage caused Chrome/Safari to show different lists. localStorage
// must only be used for per-device UI preferences (e.g. selected room).
export const useMeetingChannels = () => ({
  channels: predefinedMeetingRooms,
});
