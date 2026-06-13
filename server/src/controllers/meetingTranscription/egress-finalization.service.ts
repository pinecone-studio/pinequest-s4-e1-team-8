import { EgressInfo, EgressStatus } from "livekit-server-sdk";
import type { Bindings } from "../../lib/common/types";
import type { MeetingTranscriptionDb } from "../../lib/meetingTypes/meeting-transcription.types";
import {
  findByEgressId,
  markFailed,
  transcribeRecording,
} from "./meeting-transcription.service";

type FileShape = Record<string, unknown>;

const getRuntimeLogContext = (env: Bindings) => ({
  database: env.D1_DATABASE_NAME ?? "unknown",
  environment: env.ENVIRONMENT ?? "unknown",
});

const FILE_LOCATION_KEYS = new Set([
  "location",
  "fileLocation",
  "file_location",
]);

export const getEgressStatusName = (status: EgressStatus) => {
  return EgressStatus[status] ?? `UNKNOWN_${status}`;
};

const isRecord = (value: unknown): value is FileShape => {
  return Boolean(value) && typeof value === "object";
};

const getNonEmptyString = (value: unknown) => {
  return typeof value === "string" && value.length > 0 ? value : null;
};

const getJsonShape = (value: unknown) => {
  if (!isRecord(value)) return value;

  const maybeJson = value as { toJson?: () => unknown };

  try {
    return typeof maybeJson.toJson === "function" ? maybeJson.toJson() : value;
  } catch {
    return value;
  }
};

const findRecordingLocation = (value: unknown): string | null => {
  if (!isRecord(value)) return null;

  const data = getJsonShape(value);

  if (!isRecord(data)) return null;

  for (const key of FILE_LOCATION_KEYS) {
    const location = getNonEmptyString(data[key]);
    if (location) return location;
  }

  if ("value" in data) {
    const nestedLocation = findRecordingLocation(data.value);
    if (nestedLocation) return nestedLocation;
  }

  for (const nestedValue of Object.values(data)) {
    const nestedLocation = Array.isArray(nestedValue)
      ? nestedValue.map(findRecordingLocation).find(Boolean)
      : findRecordingLocation(nestedValue);

    if (nestedLocation) return nestedLocation;
  }

  return null;
};

export const getEgressRecordingUrl = (egress: EgressInfo) => {
  return (
    findRecordingLocation(egress.fileResults) ??
    findRecordingLocation(egress.result) ??
    findRecordingLocation(getJsonShape(egress))
  );
};

export const isCompleteEgress = (egress: EgressInfo) => {
  return egress.status === EgressStatus.EGRESS_COMPLETE;
};

export const isFailedEgress = (egress: EgressInfo) => {
  return [
    EgressStatus.EGRESS_FAILED,
    EgressStatus.EGRESS_ABORTED,
    EgressStatus.EGRESS_LIMIT_REACHED,
  ].includes(egress.status);
};

export const finalizeEgressRecording = async ({
  db,
  env,
  egress,
  userId,
}: {
  db: MeetingTranscriptionDb;
  env: Bindings;
  egress: EgressInfo;
  userId?: string | null;
}) => {
  const recordingUrl = getEgressRecordingUrl(egress);

  console.info("[meetingTranscription] Finalizing LiveKit egress", {
    ...getRuntimeLogContext(env),
    egressId: egress.egressId,
    egressStatus: getEgressStatusName(egress.status),
    recordingUrl: recordingUrl ?? null,
    roomName: egress.roomName,
  });

  if (!recordingUrl) {
    const transcription = await findByEgressId(db, egress.egressId);

    if (!transcription) {
      throw new Error("Transcription not found");
    }

    await markFailed(
      db,
      transcription.id,
      "LiveKit egress completed without recording URL",
    );

    throw new Error("LiveKit egress completed without recording URL");
  }

  await env.MEETING_TRANSCRIPTION_QUEUE.send({
    egressId: egress.egressId,
    recordingUrl,
    userId: userId ?? null,
  });

  return { status: "queued" as const };
};

export const finalizeRecordingUrl = async ({
  db,
  env,
  egressId,
  recordingUrl,
  userId,
}: {
  db: MeetingTranscriptionDb;
  env: Bindings;
  egressId: string;
  recordingUrl: string;
  userId?: string | null;
}) => {
  const transcription = await findByEgressId(db, egressId);

  if (!transcription) {
    console.warn("[meetingTranscription] No transcription row for egress", {
      ...getRuntimeLogContext(env),
      egressId,
      recordingUrl,
    });

    throw new Error("Transcription not found");
  }

  if (transcription.status === "done") {
    console.info("[meetingTranscription] Egress already finalized", {
      ...getRuntimeLogContext(env),
      egressId,
      roomName: transcription.roomName,
      transcriptionId: transcription.id,
    });

    return { status: "done" as const, skipped: true };
  }

  console.info("[meetingTranscription] Transcribing finalized recording", {
    ...getRuntimeLogContext(env),
    egressId,
    recordingUrl,
    roomName: transcription.roomName,
    transcriptionId: transcription.id,
  });

  await transcribeRecording({
    db,
    env,
    transcriptionId: transcription.id,
    meetingId: transcription.meetingId,
    recordingUrl,
    summary: transcription.summary,
    participantNames: transcription.participantNames,
    userId,
  });

  console.info("[meetingTranscription] Recording finalized", {
    ...getRuntimeLogContext(env),
    egressId,
    roomName: transcription.roomName,
    transcriptionId: transcription.id,
  });

  return { status: "done" as const, skipped: false };
};
