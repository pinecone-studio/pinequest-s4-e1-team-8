import { Context } from "hono";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import {
  getUserVoiceProfile,
  saveUserVoiceProfile,
  setUserVoiceProfileId,
} from "../../lib/voice/voice-profile.service";
import { enrollVoiceSample } from "../../lib/voice/voice-verification.service";

const MIN_AUDIO_BYTES = 8_000;

async function readAudioBuffer(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) {
  const audio = await c.req.arrayBuffer();

  if (!audio.byteLength) {
    throw new Error("Audio sample is required");
  }

  if (audio.byteLength < MIN_AUDIO_BYTES) {
    throw new Error("Recording is too short. Speak for at least 3 seconds.");
  }

  return audio;
}

export const postVoiceEnroll = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  try {
    const userId = c.get("userId");
    const db = useDB(c);
    const audio = await readAudioBuffer(c);
    const existing = await getUserVoiceProfile(db, userId);

    const result = await enrollVoiceSample({
      env: c.env,
      profileId: existing?.azureVoiceProfileId ?? null,
      existingSignature: existing?.voiceEnrollmentSignature,
      audio,
    });

    if (result.enrolled) {
      await saveUserVoiceProfile(
        db,
        userId,
        result.profileId,
        result.signature ?? existing?.voiceEnrollmentSignature ?? null,
      );
    } else {
      await setUserVoiceProfileId(
        db,
        userId,
        result.profileId,
        result.signature ?? existing?.voiceEnrollmentSignature ?? null,
      );
    }

    return c.json({
      enrolled: result.enrolled,
      enrollmentStatus: result.enrollmentStatus,
      enrollmentSpeechTime: result.enrollmentSpeechTime,
      remainingEnrollmentsSpeechLength: result.remainingEnrollmentsSpeechLength,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Enrollment failed";
    return c.json({ error: message }, 400);
  }
};
