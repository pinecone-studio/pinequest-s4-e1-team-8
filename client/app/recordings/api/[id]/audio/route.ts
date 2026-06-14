import { proxyRecordingAudio } from "../../recordings-audio-proxy";
import { BACKEND_RECORDING_ENDPOINTS } from "../../recordings-endpoints";

type RecordingAudioRouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = async (
  request: Request,
  { params }: RecordingAudioRouteContext,
) => {
  const { id } = await params;

  return proxyRecordingAudio(request, BACKEND_RECORDING_ENDPOINTS.audio(id));
};
