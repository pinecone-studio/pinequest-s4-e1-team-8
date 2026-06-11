import { and, eq, gt } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../../schema/schema";
import { inviteTokens, projects } from "../../schema/schema";

type Db = DrizzleD1Database<typeof schema>;

export async function resolveProjectByInviteToken(db: Db, token: string) {
  const now = new Date();

  const [inviteRow] = await db
    .select({
      projectId: inviteTokens.projectId,
      expiresAt: inviteTokens.expiresAt,
    })
    .from(inviteTokens)
    .where(and(eq(inviteTokens.token, token), gt(inviteTokens.expiresAt, now)))
    .limit(1);

  if (inviteRow) {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, inviteRow.projectId))
      .limit(1);
    return project ?? null;
  }

  const [legacyProject] = await db
    .select()
    .from(projects)
    .where(eq(projects.inviteToken, token))
    .limit(1);

  return legacyProject ?? null;
}
