import { eq } from "drizzle-orm";
import { users } from "../../schema/schema";
import type { useDB } from "../db/db";

type AppDb = ReturnType<typeof useDB>;

export async function getVoiceOnboardingStatus(db: AppDb, userId: string) {
  const [row] = await db
    .select({
      hasVoiceData: users.hasVoiceData,
      voiceOnboardingCompletedAt: users.voiceOnboardingCompletedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row ?? null;
}

export async function completeVoiceOnboarding(
  db: AppDb,
  userId: string,
  recordingKey: string,
) {
  await db
    .update(users)
    .set({
      hasVoiceData: true,
      voiceOnboardingRecordingKey: recordingKey,
      voiceOnboardingCompletedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
