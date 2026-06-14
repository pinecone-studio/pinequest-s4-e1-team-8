import { BACKEND_RECORDING_ENDPOINTS } from "../recordings-endpoints";
import { proxyRecordingUpload } from "../recordings-upload-proxy";

export const POST = async (request: Request) =>
  proxyRecordingUpload(request, BACKEND_RECORDING_ENDPOINTS.upload);
