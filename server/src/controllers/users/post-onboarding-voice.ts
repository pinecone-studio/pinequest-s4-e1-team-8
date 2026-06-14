import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import { completeVoiceOnboarding } from "../../lib/onboarding/voice-onboarding.service";
import {
  buildVoiceOnboardingRecordingKey,
  uploadVoiceOnboardingRecording,
} from "../../lib/r2/voice-onboarding-storage";
import type { Bindings, Variables } from "../../lib/common/types";

const MIN_AUDIO_BYTES = 1_000;
const DEFAULT_CONTENT_TYPE = "audio/webm";

export const postOnboardingVoice = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  try {
    const userId = c.get("userId");
    const audio = await c.req.arrayBuffer();

    if (audio.byteLength < MIN_AUDIO_BYTES) {
      return c.json({ error: "A voice recording is required" }, 400);
    }

    const contentType = c.req.header("Content-Type")?.trim() || DEFAULT_CONTENT_TYPE;
    const recordingKey = buildVoiceOnboardingRecordingKey(userId, contentType);

    await uploadVoiceOnboardingRecording({
      env: c.env,
      key: recordingKey,
      audio,
      contentType,
    });

    await completeVoiceOnboarding(useDB(c), userId, recordingKey);

    return c.json({ hasVoiceData: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save voice recording";
    return c.json({ error: message }, 400);
  }
};
