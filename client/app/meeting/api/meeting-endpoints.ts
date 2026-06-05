export const MEETING_ENDPOINTS = {
  createRoom: "/api/meeting-room/create",
  joinRoom: "/api/meeting-room/join",
  startEgress: "/api/meeting-transcription/start-egress",
  transcript: (id: string) => `/api/meeting-transcription/${id}`,
} as const;
