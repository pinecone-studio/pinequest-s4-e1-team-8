import { MEETING_ENDPOINTS } from "./meeting-endpoints";
import type { StopMeetingEgressRequest } from "../types/meeting-request.types";
import type { StopMeetingEgressResponse } from "../types/meeting-response.types";
import { meetingApi } from "./meeting-api";

export const stopMeetingEgress = async (
  request: StopMeetingEgressRequest
) =>
  meetingApi<StopMeetingEgressResponse>(MEETING_ENDPOINTS.stopEgress, {
    body: request,
    method: "POST",
  });
