"use client";

import type { MeetingRoomTokenResponse } from "../index";
import { LivekitRoomView } from "./livekit-room-view";

type ConnectedMeetingPanelProps = {
  meetingId: string;
  onLeave: () => void;
  response: MeetingRoomTokenResponse;
};

export const ConnectedMeetingPanel = ({
  meetingId,
  onLeave,
  response,
}: ConnectedMeetingPanelProps) => (
  <LivekitRoomView
    livekitUrl={response.url}
    livekitRoomName={response.roomName}
    meetingId={meetingId}
    onLeave={onLeave}
    roomName={response.displayRoomName ?? response.roomName}
    token={response.token}
  />
);
