import { eq } from "drizzle-orm";
import { users } from "../../db/schema";
import type { useDB } from "../db/db";

type AppDb = ReturnType<typeof useDB>;

const DEV_USER_ID = "dev_voice_user";
const DEV_USER_CLERK_ID = "dev_voice_clerk";
const DEV_USER_EMAIL = "voice-dev@brisk.local";

/**
 * Local testing only: ensure a fixed user row exists so the voice routes work
 * without a real Clerk session. Returns the dev user id.
 */
export async function ensureDevVoiceUser(db: AppDb): Promise<string> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, DEV_USER_ID))
    .limit(1);

  if (existing) {
    return existing.id;
  }

  await db
    .insert(users)
    .values({
      id: DEV_USER_ID,
      clerkId: DEV_USER_CLERK_ID,
      email: DEV_USER_EMAIL,
      name: "Voice Dev User",
    })
    .onConflictDoNothing();

  return DEV_USER_ID;
}
