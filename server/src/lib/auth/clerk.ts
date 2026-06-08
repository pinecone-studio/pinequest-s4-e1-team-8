import { createClerkClient, verifyToken } from "@clerk/backend";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { Context } from "hono";
import { nanoid } from "nanoid";
import type { Bindings } from "../common/types";
import { users } from "../../schema/schema";
import * as schema from "../../schema/schema";

const AUTHORIZED_PARTIES = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://brisk-pm.vercel.app",
];

export function extractBearerToken(c: Context<{ Bindings: Bindings }>): string | null {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return null;
  }
  return auth.slice(7);
}

async function ensureUserRecord(
  clerkUserId: string,
  secretKey: string,
  db: ReturnType<typeof drizzle<typeof schema>>,
): Promise<string | null> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkUserId))
    .limit(1);

  if (existing) {
    return existing.id;
  }

  const clerk = createClerkClient({ secretKey });
  const clerkUser = await clerk.users.getUser(clerkUserId);
  const email = clerkUser.emailAddresses[0]?.emailAddress?.trim();
  const name =
    clerkUser.fullName?.trim() ||
    clerkUser.firstName?.trim() ||
    clerkUser.username?.trim() ||
    email;

  if (!email || !name) {
    return null;
  }

  const [created] = await db
    .insert(users)
    .values({
      id: `user_${nanoid(10)}`,
      clerkId: clerkUserId,
      email,
      name,
      avatarUrl: clerkUser.imageUrl ?? null,
    })
    .returning({ id: users.id });

  return created?.id ?? null;
}

export async function resolveAuthenticatedUserId(
  c: Context<{ Bindings: Bindings }>,
): Promise<string | null> {
  const token = extractBearerToken(c);
  if (!token) {
    return null;
  }

  const secretKey = c.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  let clerkUserId: string | undefined;
  try {
    const payload = await verifyToken(token, {
      secretKey,
      authorizedParties: AUTHORIZED_PARTIES,
    });
    clerkUserId = payload.sub;
  } catch {
    return null;
  }

  if (!clerkUserId) {
    return null;
  }

  const db = drizzle(c.env.DB, { schema });
  return ensureUserRecord(clerkUserId, secretKey, db);
}

export async function getAuthenticatedUserId(
  c: Context<{ Bindings: Bindings }>,
): Promise<string | null> {
  return resolveAuthenticatedUserId(c);
}
