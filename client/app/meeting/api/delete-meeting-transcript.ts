import { MEETING_ENDPOINTS } from "./meeting-endpoints";
import type { DeleteMeetingTranscriptResponse } from "../types/meeting-response.types";
import { meetingApi } from "./meeting-api";

export const deleteMeetingTranscript = async (id: string) =>
  meetingApi<DeleteMeetingTranscriptResponse>(MEETING_ENDPOINTS.transcript(id), {
    method: "DELETE",
  });
