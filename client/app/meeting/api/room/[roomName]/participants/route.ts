import { BACKEND_MEETING_ENDPOINTS } from "../../../meeting-endpoints";
import { proxyMeetingGetRequest } from "../../../meeting-proxy";

type RoomParticipantsRouteContext = {
  params: Promise<{ roomName: string }>;
};

export const GET = async (
  request: Request,
  { params }: RoomParticipantsRouteContext,
) => {
  const { roomName } = await params;

  return proxyMeetingGetRequest(
    request,
    BACKEND_MEETING_ENDPOINTS.roomParticipants(roomName),
  );
};
