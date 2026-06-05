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

export type GetMeetingTranscriptRequest = {
  id: string;
};
