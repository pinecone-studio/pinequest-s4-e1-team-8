import { BACKEND_MEETING_ENDPOINTS } from "../../meeting-endpoints";
import { proxyMeetingGetRequest } from "../../meeting-proxy";

export const GET = async () =>
  proxyMeetingGetRequest(BACKEND_MEETING_ENDPOINTS.latestTranscript);
