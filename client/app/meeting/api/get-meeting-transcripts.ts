import { MEETING_ENDPOINTS } from "./meeting-endpoints";
import type { GetMeetingTranscriptsResponse } from "../types/meeting-response.types";
import { meetingApi } from "./meeting-api";

export const getMeetingTranscripts = async () =>
  meetingApi<GetMeetingTranscriptsResponse>(MEETING_ENDPOINTS.transcripts);
