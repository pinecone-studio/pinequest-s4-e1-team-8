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
    meetingId={meetingId}
    onLeave={onLeave}
    roomName={response.roomName}
    token={response.token}
  />
);
