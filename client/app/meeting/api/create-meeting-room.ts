import { MEETING_ENDPOINTS } from "./meeting-endpoints";
import type { CreateMeetingRoomRequest } from "../types/meeting-request.types";
import type { CreateMeetingRoomResponse } from "../types/meeting-response.types";
import { meetingApi } from "./meeting-api";

export const createMeetingRoom = async (request: CreateMeetingRoomRequest) =>
  meetingApi<CreateMeetingRoomResponse>(MEETING_ENDPOINTS.createRoom, {
    body: request,
    method: "POST",
  });
