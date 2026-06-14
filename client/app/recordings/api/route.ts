import { proxyMeetingGetRequest } from "@/app/meeting/api/meeting-proxy";
import { BACKEND_RECORDING_ENDPOINTS } from "./recordings-endpoints";

export const GET = async (request: Request) =>
  proxyMeetingGetRequest(request, BACKEND_RECORDING_ENDPOINTS.list);
