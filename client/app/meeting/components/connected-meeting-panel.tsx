"use client";

import type { MeetingRoomTokenResponse } from "../index";
import { LivekitRoomView } from "./livekit-room-view";

type ConnectedMeetingPanelProps = {
  autoRecord?: boolean;
  meetingId: string;
  onLeave: () => void;
  response: MeetingRoomTokenResponse;
};

export const ConnectedMeetingPanel = ({
  autoRecord,
  meetingId,
  onLeave,
  response,
}: ConnectedMeetingPanelProps) => (
  <LivekitRoomView
    autoRecord={autoRecord}
    livekitRoomName={response.roomName}
    meetingId={meetingId}
    onLeave={onLeave}
    roomName={response.displayRoomName ?? response.roomName}
  />
);
