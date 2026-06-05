import { BACKEND_MEETING_ENDPOINTS } from "../../meeting-endpoints";
import { proxyMeetingGetRequest } from "../../meeting-proxy";

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
