import { clientApi } from "@/app/lib/client-api";
import { isAxiosError } from "axios";

export type VoiceOnboardingStatus = {
  hasVoiceData: boolean;
  completedAt: string | null;
};

export async function getVoiceOnboardingStatus(): Promise<VoiceOnboardingStatus> {
  const { data } = await clientApi.get<VoiceOnboardingStatus>("/users/onboarding/voice-status");
  return data;
}

export async function submitVoiceOnboardingRecording(
  audio: Blob,
): Promise<VoiceOnboardingStatus> {
  const { data } = await clientApi.post<VoiceOnboardingStatus>(
    "/users/onboarding/voice",
    audio,
    {
      headers: {
        "Content-Type": audio.type || "audio/webm",
      },
    },
  );

  return data;
}

export function formatOnboardingApiError(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.error;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return "Something went wrong saving your recording. Please try again.";
}
