"use client";

import type { MeetingRoomTokenResponse } from "../index";
import type { TranscriptLanguage } from "../utils/transcript-language";
import { LivekitRoomView } from "./livekit-room-view";

type ConnectedMeetingPanelProps = {
  autoRecord?: boolean;
  meetingId: string;
  onLeave: () => void;
  response: MeetingRoomTokenResponse;
  transcriptLanguage?: TranscriptLanguage;
};

export const ConnectedMeetingPanel = ({
  autoRecord,
  meetingId,
  onLeave,
  response,
  transcriptLanguage,
}: ConnectedMeetingPanelProps) => (
  <LivekitRoomView
    autoRecord={autoRecord}
    livekitRoomName={response.roomName}
    meetingId={meetingId}
    onLeave={onLeave}
    roomName={response.displayRoomName ?? response.roomName}
    transcriptLanguage={transcriptLanguage}
  />
);
