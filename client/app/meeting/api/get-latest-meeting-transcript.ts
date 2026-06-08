import { MEETING_ENDPOINTS } from "./meeting-endpoints";
import type { GetMeetingTranscriptResponse } from "../types/meeting-response.types";
import { meetingApi } from "./meeting-api";

export const getLatestMeetingTranscript = async () =>
  meetingApi<GetMeetingTranscriptResponse>(MEETING_ENDPOINTS.latestTranscript);
