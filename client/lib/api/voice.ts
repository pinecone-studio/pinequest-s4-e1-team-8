import { clientApi } from "@/app/lib/client-api";
import axios from "axios";

export type VoiceStatusResponse = {
  enrolled: boolean;
};

export type VoiceEnrollResponse = {
  enrolled: boolean;
  enrollmentStatus: string;
  enrollmentSpeechTime: number | null;
  remainingEnrollmentsSpeechLength: number | null;
};

export type VoiceVerifyResponse = {
  verified: boolean;
  score: number | null;
};

export function formatVoiceApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const backendMessage =
      typeof error.response?.data === "object" &&
      error.response?.data &&
      "error" in error.response.data &&
      typeof error.response.data.error === "string"
        ? error.response.data.error
        : null;

    if (backendMessage) {
      return backendMessage;
    }

    if (error.response?.status === 401) {
      return "Sign in expired. Refresh the page and try again.";
    }

    if (!error.response || error.response.status >= 500) {
      return "Backend server is not reachable. Run: cd server && bun run dev";
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Voice verification failed. Try again.";
}

export async function getVoiceStatus() {
  const { data } = await clientApi.get<VoiceStatusResponse>(
    "/api/backend/voice/status",
  );
  return data;
}

async function postVoiceAudio(path: string, audio: Blob) {
  const { data } = await clientApi.post(
    path,
    await audio.arrayBuffer(),
    {
      headers: { "Content-Type": "audio/wav" },
      timeout: 30_000,
    },
  );

  return data;
}

export async function enrollVoice(audio: Blob) {
  return postVoiceAudio("/api/backend/voice/enroll", audio) as Promise<VoiceEnrollResponse>;
}

export async function verifyVoice(audio: Blob) {
  return postVoiceAudio("/api/backend/voice/verify", audio) as Promise<VoiceVerifyResponse>;
}
