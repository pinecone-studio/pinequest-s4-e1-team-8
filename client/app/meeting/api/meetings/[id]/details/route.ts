import { BACKEND_MEETING_ENDPOINTS } from "../../../meeting-endpoints";
import { proxyMeetingGetRequest } from "../../../meeting-proxy";

type MeetingDetailsRouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = async (
  request: Request,
  { params }: MeetingDetailsRouteContext
) => {
  const { id } = await params;

  return proxyMeetingGetRequest(
    request,
    BACKEND_MEETING_ENDPOINTS.meetingDetails(id)
  );
};
