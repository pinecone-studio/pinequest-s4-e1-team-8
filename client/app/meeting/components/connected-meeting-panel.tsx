"use client";

import type { MeetingRoomTokenResponse } from "../index";
import { DebugOutput } from "./debug-output";
import { LivekitRoomView } from "./livekit-room-view";

type ConnectedMeetingPanelProps = {
  livekitUrl: string;
  onLeave: () => void;
  response: MeetingRoomTokenResponse;
  token: string;
};

export const ConnectedMeetingPanel = ({
  livekitUrl,
  onLeave,
  response,
  token,
}: ConnectedMeetingPanelProps) => (
  <div className="space-y-4">
    <LivekitRoomView
      livekitUrl={response.url}
      onLeave={onLeave}
      roomName={response.roomName}
      token={response.token}
    />
    <DebugOutput
      label="Returned meeting values"
      value={{ livekitUrl, roomName: response.roomName, token }}
    />
  </div>
);
