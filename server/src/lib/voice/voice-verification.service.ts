import { nanoid } from "nanoid";
import type { Bindings } from "../common/types";
import {
  createVerificationProfile,
  enrollVerificationProfile,
  getVerificationProfile,
  isProfileEnrolled,
  isVerificationAccepted,
  verifyVerificationProfile,
} from "../azure/speaker-verification";
import {
  enrollLocalVoice,
  isLocalVerificationAccepted,
  verifyLocalVoice,
} from "./local-voice-verification";

export type VoiceEnrollmentResult = {
  enrolled: boolean;
  enrollmentStatus: string;
  enrollmentSpeechTime: number | null;
  remainingEnrollmentsSpeechLength: number | null;
  profileId: string;
  signature?: number[];
};

export type VoiceVerifyResult = {
  verified: boolean;
  score: number | null;
};

function isAzureVoiceConfigured(env: Bindings) {
  return Boolean(env.AZURE_SPEECH_KEY?.trim() && env.AZURE_SPEECH_REGION?.trim());
}

function useLocalVoiceProvider(env: Bindings) {
  const mode = env.VOICE_VERIFICATION_MODE?.trim().toLowerCase();

  if (mode === "azure") {
    return false;
  }

  if (mode === "local") {
    return true;
  }

  return !isAzureVoiceConfigured(env);
}

export function getVoiceProviderLabel(env: Bindings) {
  return useLocalVoiceProvider(env) ? "local" : "azure";
}

export async function enrollVoiceSample({
  env,
  profileId,
  existingSignature,
  audio,
}: {
  env: Bindings;
  profileId: string | null;
  existingSignature?: number[] | null;
  audio: ArrayBuffer;
}): Promise<VoiceEnrollmentResult> {
  if (useLocalVoiceProvider(env)) {
    const enrollment = enrollLocalVoice(audio, existingSignature);
    const nextProfileId = profileId ?? `local_${nanoid(12)}`;

    return {
      enrolled: true,
      enrollmentStatus: "Enrolled",
      enrollmentSpeechTime: enrollment.enrollmentSpeechTime,
      remainingEnrollmentsSpeechLength: enrollment.remainingEnrollmentsSpeechLength,
      profileId: nextProfileId,
      signature: enrollment.signature,
    };
  }

  let nextProfileId = profileId;

  if (!nextProfileId) {
    const created = await createVerificationProfile(env);
    nextProfileId = created.profileId;
  }

  const enrollment = await enrollVerificationProfile(env, nextProfileId, audio);
  const profile = await getVerificationProfile(env, nextProfileId);
  const enrollmentStatus =
    profile.enrollmentStatus ?? enrollment.enrollmentStatus ?? "Unknown";

  return {
    enrolled: isProfileEnrolled(enrollmentStatus),
    enrollmentStatus,
    enrollmentSpeechTime: enrollment.enrollmentSpeechTime ?? null,
    remainingEnrollmentsSpeechLength:
      enrollment.remainingEnrollmentsSpeechLength ?? null,
    profileId: nextProfileId,
  };
}

export async function verifyVoiceSample({
  env,
  profileId,
  storedSignature,
  audio,
}: {
  env: Bindings;
  profileId: string;
  storedSignature?: number[] | null;
  audio: ArrayBuffer;
}): Promise<VoiceVerifyResult> {
  if (useLocalVoiceProvider(env)) {
    if (!storedSignature?.length) {
      throw new Error("Voice profile is not enrolled yet");
    }

    const result = verifyLocalVoice(audio, storedSignature);

    return {
      verified: isLocalVerificationAccepted(result),
      score: result.score,
    };
  }

  const result = await verifyVerificationProfile(env, profileId, audio);

  return {
    verified: isVerificationAccepted(result),
    score: result.score ?? null,
  };
}
