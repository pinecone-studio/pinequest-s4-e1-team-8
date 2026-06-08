export type MeetingRoomTokenResponse = {
  displayRoomName?: string;
  roomName: string;
  token: string;
  url: string;
};

export type CreateMeetingRoomResponse = MeetingRoomTokenResponse;

export type JoinMeetingRoomResponse = MeetingRoomTokenResponse;

export type StartMeetingEgressResponse = {
  transcriptionId: string;
  egressId: string;
  status: "processing";
};

export type StopMeetingEgressResponse = {
  transcriptionId: string;
  egressId: string;
  status: "processing";
};

export type GenerateMeetingSummaryResponse = {
  id: string;
  transcript: string;
  summary?: string | null;
};

export type MeetingTranscriptionStatus =
  | "pending"
  | "processing"
  | "done"
  | "failed";

export type GetMeetingTranscriptResponse = {
  id: string;
  meetingId: string;
  roomName: string;
  audioUrl: string | null;
  egressId: string | null;
  transcript: string | null;
  summary: string | null;
  errorMessage: string | null;
  status: MeetingTranscriptionStatus;
  createdAt: string | null;
  updatedAt: string | null;
  completedAt: string | null;
};
