export const MEETING_ENDPOINTS = {
  createRoom: "/meeting/api/createRoom",
  joinRoom: "/meeting/api/joinRoom",
  startEgress: "/meeting/api/startEgress",
  summary: "/meeting/api/summary",
  transcript: (id: string) => `/meeting/api/transcript/${id}`,
} as const;

export const BACKEND_MEETING_ENDPOINTS = {
  createRoom: "/api/meeting-room/create",
  joinRoom: "/api/meeting-room/join",
  startEgress: "/api/meeting-transcription/start-egress",
  summary: "/api/meeting-transcription/summary",
  transcript: (id: string) => `/api/meeting-transcription/${id}`,
} as const;
