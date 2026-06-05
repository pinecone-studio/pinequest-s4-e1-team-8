import { MEETING_ENDPOINTS } from "./meeting-endpoints";
import type { GetMeetingTranscriptRequest } from "../types/meeting-request.types";
import type { GetMeetingTranscriptResponse } from "../types/meeting-response.types";
import { meetingApi } from "./meeting-api";

export const getMeetingTranscript = async (
  request: GetMeetingTranscriptRequest
) =>
  meetingApi<GetMeetingTranscriptResponse>(
    MEETING_ENDPOINTS.transcript(request.id)
  );
