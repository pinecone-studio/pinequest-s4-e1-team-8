import type { LiveKitEgressCompletePayload } from "../../lib/meetingTypes/livekit-egress.types";

const getString = (value: unknown) => {
  return typeof value === "string" && value.length > 0 ? value : null;
};

const getUrl = (value: unknown) => {
  const url = getString(value);

  if (!url) return null;
  return url.startsWith("http://") || url.startsWith("https://") ? url : null;
};

const findRecordingUrl = (value: unknown): string | null => {
  if (!value || typeof value !== "object") return null;

  const data = value as Record<string, unknown>;
  const directUrl =
    getUrl(data.location) ??
    getUrl(data.url) ??
    getUrl(data.downloadUrl) ??
    getUrl(data.fileUrl) ??
    getUrl(data.file_url);

  if (directUrl) return directUrl;

  for (const nestedValue of Object.values(data)) {
    const nestedUrl = findRecordingUrl(nestedValue);
    if (nestedUrl) return nestedUrl;
  }

  return null;
};

export const parseLiveKitEgressCompletePayload = (
  payload: unknown,
): LiveKitEgressCompletePayload => {
  if (!payload || typeof payload !== "object") {
    return { egressId: null, recordingUrl: null };
  }

  const data = payload as Record<string, unknown>;
  const egressInfo = data.egressInfo ?? data.egress_info ?? data.egress;
  const egressData =
    egressInfo && typeof egressInfo === "object"
      ? (egressInfo as Record<string, unknown>)
      : data;

  return {
    egressId:
      getString(egressData.egressId) ??
      getString(egressData.egress_id) ??
      getString(data.egressId) ??
      getString(data.egress_id),
    recordingUrl: findRecordingUrl(egressData) ?? findRecordingUrl(data),
  };
};
