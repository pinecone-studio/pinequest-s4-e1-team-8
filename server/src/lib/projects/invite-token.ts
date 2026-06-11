import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { nanoid } from "nanoid";
import * as schema from "../../schema/schema";
import { projects } from "../../schema/schema";

type Db = DrizzleD1Database<typeof schema>;

export function createInviteToken() {
  return `inv_${nanoid(16)}`;
}

/**
 * Returns the project's invite token, generating and persisting one if it
 * doesn't have one yet. Lets a project be shared as soon as it exists,
 * independent of how far onboarding (TDD discovery, planning, etc.) got.
 */
export async function ensureProjectInviteToken(
  db: Db,
  projectId: string,
  currentToken: string | null,
): Promise<string> {
  if (currentToken) {
    return currentToken;
  }

  const token = createInviteToken();
  await db
    .update(projects)
    .set({ inviteToken: token })
    .where(eq(projects.id, projectId));

  return token;
}
