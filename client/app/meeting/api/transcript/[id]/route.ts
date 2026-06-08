import { BACKEND_MEETING_ENDPOINTS } from "../../meeting-endpoints";
import {
  proxyMeetingDeleteRequest,
  proxyMeetingGetRequest,
} from "../../meeting-proxy";

type TranscriptRouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = async (
  _request: Request,
  { params }: TranscriptRouteContext
) => {
  const { id } = await params;

  return proxyMeetingGetRequest(BACKEND_MEETING_ENDPOINTS.transcript(id));
};

export const DELETE = async (
  _request: Request,
  { params }: TranscriptRouteContext
) => {
  const { id } = await params;

  return proxyMeetingDeleteRequest(BACKEND_MEETING_ENDPOINTS.transcript(id));
};
