import { BACKEND_MEETING_ENDPOINTS } from "../../meeting-endpoints";
import {
  proxyMeetingDeleteRequest,
  proxyMeetingGetRequest,
} from "../../meeting-proxy";

type TranscriptRouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = async (
  request: Request,
  { params }: TranscriptRouteContext
) => {
  const { id } = await params;

  return proxyMeetingGetRequest(request, BACKEND_MEETING_ENDPOINTS.transcript(id));
};

export const DELETE = async (
  request: Request,
  { params }: TranscriptRouteContext
) => {
  const { id } = await params;

  return proxyMeetingDeleteRequest(request, BACKEND_MEETING_ENDPOINTS.transcript(id));
};
