"use client";

import { MeetingChannelPresenceProvider } from "./meeting-channel-presence-provider";
import { MeetingSessionProvider } from "./meeting-session-provider";

export function MeetingProviders({ children }: { children: React.ReactNode }) {
  return (
    <MeetingChannelPresenceProvider>
      <MeetingSessionProvider>{children}</MeetingSessionProvider>
    </MeetingChannelPresenceProvider>
  );
}
