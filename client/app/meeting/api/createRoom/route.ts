import { BACKEND_MEETING_ENDPOINTS } from "../meeting-endpoints";
import { proxyMeetingPostRequest } from "../meeting-proxy";

export const POST = async (request: Request) =>
  proxyMeetingPostRequest(request, BACKEND_MEETING_ENDPOINTS.createRoom);
