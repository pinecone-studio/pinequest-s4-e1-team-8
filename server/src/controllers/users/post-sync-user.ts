import { eq } from "drizzle-orm";
import { Context } from "hono";
import { nanoid } from "nanoid";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { users } from "../../schema/schema";

type SyncUserBody = {
  clerkId?: string;
  email?: string;
  name?: string;
  avatarUrl?: string | null;
};

export const syncUser = async (c: Context<{ Bindings: Bindings }>) => {
  const body = (await c.req.json().catch(() => null)) as SyncUserBody | null;

  if (!body?.clerkId?.trim() || !body.email?.trim() || !body.name?.trim()) {
    return c.json({ error: "clerkId, email, and name are required" }, 400);
  }

  const db = useDB(c);
  const clerkId = body.clerkId.trim();
  const email = body.email.trim();
  const name = body.name.trim();
  const avatarUrl = body.avatarUrl?.trim() || null;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({ email, name, avatarUrl })
      .where(eq(users.id, existing.id))
      .returning({
        id: users.id,
        clerkId: users.clerkId,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
      });

    return c.json({ user: updated });
  }

  const [created] = await db
    .insert(users)
    .values({
      id: `user_${nanoid(10)}`,
      clerkId,
      email,
      name,
      avatarUrl,
    })
    .returning({
      id: users.id,
      clerkId: users.clerkId,
      email: users.email,
      name: users.name,
      avatarUrl: users.avatarUrl,
    });

  return c.json({ user: created }, 201);
};
