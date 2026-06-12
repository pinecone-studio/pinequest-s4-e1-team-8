import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import { getUserVoiceProfile } from "../../lib/voice/voice-profile.service";
import { getVoiceProviderLabel } from "../../lib/voice/voice-verification.service";
import type { Bindings, Variables } from "../../lib/common/types";

export const getVoiceStatus = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  const userId = c.get("userId");
  const profile = await getUserVoiceProfile(useDB(c), userId);

  return c.json({
    enrolled: Boolean(profile?.azureVoiceProfileId && profile.voiceEnrolledAt),
    provider: getVoiceProviderLabel(c.env),
  });
};
