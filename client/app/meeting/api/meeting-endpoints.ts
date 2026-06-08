export const MEETING_ENDPOINTS = {
  createRoom: "/meeting/api/createRoom",
  joinRoom: "/meeting/api/joinRoom",
  startEgress: "/meeting/api/startEgress",
  stopEgress: "/meeting/api/stopEgress",
  summary: "/meeting/api/summary",
  transcripts: "/meeting/api/transcripts",
  latestTranscript: "/meeting/api/transcript/latest",
  transcript: (id: string) => `/meeting/api/transcript/${id}`,
} as const;

export const BACKEND_MEETING_ENDPOINTS = {
  createRoom: "/api/meeting-room/create",
  joinRoom: "/api/meeting-room/join-room",
  startEgress: "/api/meeting-transcription/start-egress",
  stopEgress: "/api/meeting-transcription/stop-egress",
  summary: "/api/meeting-transcription/summary",
  transcripts: "/api/meeting-transcription",
  latestTranscript: "/api/meeting-transcription/latest",
  transcript: (id: string) => `/api/meeting-transcription/${id}`,
} as const;
