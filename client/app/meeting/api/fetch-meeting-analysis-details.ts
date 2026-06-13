import { MEETING_ENDPOINTS } from "./meeting-endpoints";
import type { GetMeetingAnalysisDetailsResponse } from "../types/meeting-response.types";
import { meetingApi } from "./meeting-api";

export const fetchMeetingAnalysisDetails = async (meetingId: string) =>
  meetingApi<GetMeetingAnalysisDetailsResponse>(
    MEETING_ENDPOINTS.meetingDetails(meetingId)
  );
