import { eq } from "drizzle-orm";
import { users } from "../../db/schema";
import type { useDB } from "../db/db";

type AppDb = ReturnType<typeof useDB>;

export async function getUserVoiceProfile(db: AppDb, userId: string) {
  const [row] = await db
    .select({
      azureVoiceProfileId: users.azureVoiceProfileId,
      voiceEnrolledAt: users.voiceEnrolledAt,
      voiceEnrollmentSignature: users.voiceEnrollmentSignature,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row ?? null;
}

export async function saveUserVoiceProfile(
  db: AppDb,
  userId: string,
  profileId: string,
  signature?: number[] | null,
) {
  await db
    .update(users)
    .set({
      azureVoiceProfileId: profileId,
      voiceEnrolledAt: new Date(),
      voiceEnrollmentSignature: signature ?? null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function setUserVoiceProfileId(
  db: AppDb,
  userId: string,
  profileId: string,
  signature?: number[] | null,
) {
  await db
    .update(users)
    .set({
      azureVoiceProfileId: profileId,
      voiceEnrollmentSignature: signature ?? null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
