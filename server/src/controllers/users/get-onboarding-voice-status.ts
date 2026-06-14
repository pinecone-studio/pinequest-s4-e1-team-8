import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import { getVoiceOnboardingStatus } from "../../lib/onboarding/voice-onboarding.service";
import type { Bindings, Variables } from "../../lib/common/types";

export const getOnboardingVoiceStatus = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  const userId = c.get("userId");
  const status = await getVoiceOnboardingStatus(useDB(c), userId);

  return c.json({
    hasVoiceData: Boolean(status?.hasVoiceData),
    completedAt: status?.voiceOnboardingCompletedAt ?? null,
  });
};
