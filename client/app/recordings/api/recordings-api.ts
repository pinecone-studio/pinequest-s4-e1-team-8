import { meetingApi } from "@/app/meeting/api/meeting-api";
import { RECORDING_ENDPOINTS } from "./recordings-endpoints";
import type {
  ListRecordingsResponse,
  StandaloneRecording,
  UploadRecordingResponse,
} from "../types";

type ClerkWindow = Window & {
  Clerk?: {
    session?: {
      getToken: () => Promise<string | null>;
    } | null;
  };
};

const getClerkToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;

  try {
    return (await (window as ClerkWindow).Clerk?.session?.getToken()) ?? null;
  } catch {
    return null;
  }
};

const getErrorMessage = async (response: Response) => {
  const fallback = `Recording API request failed with status ${response.status}.`;

  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
};

// Multipart upload — sent directly (not via meetingApi, which JSON-encodes).
export const uploadRecording = async (
  blob: Blob,
  filename: string,
  title?: string,
  durationSeconds?: number,
): Promise<UploadRecordingResponse> => {
  const token = await getClerkToken();
  const form = new FormData();
  form.append("file", blob, filename);
  if (title) form.append("title", title);
  if (durationSeconds != null && durationSeconds > 0) {
    form.append("durationSeconds", String(durationSeconds));
  }

  const response = await fetch(RECORDING_ENDPOINTS.upload, {
    method: "POST",
    body: form,
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as UploadRecordingResponse;
};

export const listRecordings = () =>
  meetingApi<ListRecordingsResponse>(RECORDING_ENDPOINTS.list);

export const getRecording = (id: string) =>
  meetingApi<StandaloneRecording>(RECORDING_ENDPOINTS.recording(id));

export const deleteRecording = async (id: string) => {
  const token = await getClerkToken();

  const response = await fetch(RECORDING_ENDPOINTS.recording(id), {
    method: "DELETE",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as { ok: true };
};

export const downloadRecording = async (id: string, filename: string) => {
  const token = await getClerkToken();

  const response = await fetch(RECORDING_ENDPOINTS.audio(id), {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename.endsWith(".mp3") ? filename : `${filename}.mp3`;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
};

// Fetches the recording's audio as an authenticated blob and returns an object
// URL for an <audio> element. A bare <audio src> can't send the Clerk Bearer
// token, so we download it here. Caller must revoke the URL when done.
export const fetchRecordingAudioObjectUrl = async (
  id: string,
): Promise<string> => {
  const token = await getClerkToken();

  const response = await fetch(RECORDING_ENDPOINTS.audio(id), {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return URL.createObjectURL(await response.blob());
};
