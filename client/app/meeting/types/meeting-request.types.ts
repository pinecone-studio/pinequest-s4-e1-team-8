export type CreateMeetingRoomRequest = {
  roomName: string;
  hostName: string;
};

export type JoinMeetingRoomRequest = {
  roomName: string;
  participantName: string;
};

export type StartMeetingEgressRequest = {
  meetingId: string;
  roomName: string;
  filepath?: string;
};

export type StopMeetingEgressRequest = {
  egressId: string;
};

export type GetMeetingTranscriptRequest = {
  id: string;
};

export type GenerateMeetingSummaryRequest = {
  roomName: string;
  meetingId: string;
  recordingUrl: string;
  egressId?: string;
  summary?: string;
};
