import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import { getUserVoiceProfile } from "../../lib/voice/voice-profile.service";
import { verifyVoiceSample } from "../../lib/voice/voice-verification.service";
import type { Bindings, Variables } from "../../lib/common/types";

const MIN_AUDIO_BYTES = 8_000;

export const postVoiceVerify = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  try {
    const userId = c.get("userId");
    const profile = await getUserVoiceProfile(useDB(c), userId);
    const profileId = profile?.azureVoiceProfileId;

    if (!profileId || !profile.voiceEnrolledAt) {
      return c.json({ error: "Voice profile is not enrolled yet" }, 400);
    }

    const audio = await c.req.arrayBuffer();

    if (!audio.byteLength) {
      return c.json({ error: "Audio sample is required" }, 400);
    }

    if (audio.byteLength < MIN_AUDIO_BYTES) {
      return c.json(
        { error: "Recording is too short. Speak for at least 3 seconds." },
        400,
      );
    }

    const result = await verifyVoiceSample({
      env: c.env,
      profileId,
      storedSignature: profile.voiceEnrollmentSignature,
      audio,
    });

    if (!result.verified) {
      return c.json(
        {
          verified: false,
          score: result.score,
          error: "Voice did not match your enrolled profile. Try again.",
        },
        401,
      );
    }

    return c.json({
      verified: true,
      score: result.score,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return c.json({ error: message }, 400);
  }
};
