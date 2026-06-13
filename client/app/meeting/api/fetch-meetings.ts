import { MEETING_ENDPOINTS } from "./meeting-endpoints";
import type { GetMeetingsResponse } from "../types/meeting-response.types";
import { meetingApi } from "./meeting-api";

export const fetchMeetings = async () =>
  meetingApi<GetMeetingsResponse>(MEETING_ENDPOINTS.meetings);
