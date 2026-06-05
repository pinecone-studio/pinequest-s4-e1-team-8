import { MEETING_ENDPOINTS } from "./meeting-endpoints";
import type { GenerateMeetingSummaryRequest } from "../types/meeting-request.types";
import type { GenerateMeetingSummaryResponse } from "../types/meeting-response.types";
import { meetingApi } from "./meeting-api";

export const generateMeetingSummary = async (
  request: GenerateMeetingSummaryRequest
) =>
  meetingApi<GenerateMeetingSummaryResponse>(MEETING_ENDPOINTS.summary, {
    body: request,
    method: "POST",
  });
