import type { LiveKitEgressCompletePayload } from "../../lib/meetingTypes/livekit-egress.types";

const getString = (value: unknown) => {
  return typeof value === "string" && value.length > 0 ? value : null;
};

const getUrl = (value: unknown) => {
  const url = getString(value);

  if (!url) return null;
  return url.startsWith("http://") || url.startsWith("https://") ? url : null;
};

const FINAL_EGRESS_EVENTS = new Set(["egress_ended"]);

const FINAL_EGRESS_STATUSES = new Set([
  "EGRESS_COMPLETE",
  "EGRESS_FAILED",
  "EGRESS_ABORTED",
  "EGRESS_LIMIT_REACHED",
]);

const getEgressStatus = (value: unknown) => {
  const status = getString(value);

  if (!status) return null;
  return status.toUpperCase();
};

const isFinalEgressEvent = (
  event: string | null,
  egressData: Record<string, unknown>,
) => {
  if (event && FINAL_EGRESS_EVENTS.has(event)) return true;

  const status = getEgressStatus(egressData.status);

  return status ? FINAL_EGRESS_STATUSES.has(status) : false;
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
    return {
      egressId: null,
      event: null,
      isFinal: false,
      recordingUrl: null,
    };
  }

  const data = payload as Record<string, unknown>;
  const event = getString(data.event);
  const egressInfo = data.egressInfo ?? data.egress_info ?? data.egress;
  const egressData =
    egressInfo && typeof egressInfo === "object"
      ? (egressInfo as Record<string, unknown>)
      : data;

  return {
    event,
    egressId:
      getString(egressData.egressId) ??
      getString(egressData.egress_id) ??
      getString(data.egressId) ??
      getString(data.egress_id),
    isFinal: isFinalEgressEvent(event, egressData),
    recordingUrl: findRecordingUrl(egressData) ?? findRecordingUrl(data),
  };
};
