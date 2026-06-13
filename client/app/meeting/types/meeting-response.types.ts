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
  participantNames: string[] | null;
  errorMessage: string | null;
  status: MeetingTranscriptionStatus;
  createdAt: string | null;
  updatedAt: string | null;
  completedAt: string | null;
};

export type GetMeetingTranscriptsResponse = {
  transcripts: GetMeetingTranscriptResponse[];
};

export type DeleteMeetingTranscriptResponse = {
  message: string;
};

export type MeetingDetailsActionItem = {
  owner: string;
  action: string;
};

export type MeetingDetailsSummary = {
  id: string;
  meetingId: string;
  content: string;
  keyPoints: string[] | null;
  actionItems: MeetingDetailsActionItem[] | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type MeetingTranscriptSegment = {
  id: string;
  meetingId: string;
  speakerName: string;
  text: string;
  timestamp: string;
};

export type MeetingListItem = {
  id: string;
  title: string;
  createdAt: string | null;
  updatedAt: string | null;
  transcriptionStatus: MeetingTranscriptionStatus | null;
  summaryPreview: string | null;
};

export type GetMeetingsResponse = {
  meetings: MeetingListItem[];
};

export type GetMeetingAnalysisDetailsResponse = {
  meeting: {
    id: string;
    userId: string;
    title: string;
    createdAt: string | null;
    updatedAt: string | null;
  };
  transcription: GetMeetingTranscriptResponse | null;
  summary: MeetingDetailsSummary | null;
  transcriptSegments: MeetingTranscriptSegment[];
};
