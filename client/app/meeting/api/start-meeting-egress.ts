import { MEETING_ENDPOINTS } from "./meeting-endpoints";
import type { StartMeetingEgressRequest } from "../types/meeting-request.types";
import type { StartMeetingEgressResponse } from "../types/meeting-response.types";
import { meetingApi } from "./meeting-api";

export const startMeetingEgress = async (
  request: StartMeetingEgressRequest
) =>
  meetingApi<StartMeetingEgressResponse>(MEETING_ENDPOINTS.startEgress, {
    body: request,
    method: "POST",
  });
