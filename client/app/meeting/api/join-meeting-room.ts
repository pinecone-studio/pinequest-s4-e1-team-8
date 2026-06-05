import { MEETING_ENDPOINTS } from "./meeting-endpoints";
import type { JoinMeetingRoomRequest } from "../types/meeting-request.types";
import type { JoinMeetingRoomResponse } from "../types/meeting-response.types";
import { meetingApi } from "./meeting-api";

export const joinMeetingRoom = async (request: JoinMeetingRoomRequest) =>
  meetingApi<JoinMeetingRoomResponse>(MEETING_ENDPOINTS.joinRoom, {
    body: request,
    method: "POST",
  });
