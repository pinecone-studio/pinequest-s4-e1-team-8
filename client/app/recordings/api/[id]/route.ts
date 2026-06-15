import { proxyMeetingDeleteRequest, proxyMeetingGetRequest } from "@/app/meeting/api/meeting-proxy";
import { BACKEND_RECORDING_ENDPOINTS } from "../recordings-endpoints";

type RecordingRouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = async (
  request: Request,
  { params }: RecordingRouteContext,
) => {
  const { id } = await params;

  return proxyMeetingGetRequest(request, BACKEND_RECORDING_ENDPOINTS.recording(id));
};

export const DELETE = async (
  request: Request,
  { params }: RecordingRouteContext,
) => {
  const { id } = await params;

  return proxyMeetingDeleteRequest(request, BACKEND_RECORDING_ENDPOINTS.recording(id));
};
