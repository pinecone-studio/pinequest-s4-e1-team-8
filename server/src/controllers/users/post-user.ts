import { Context } from "hono";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { users } from "../../schema/schema";

export const createUser = async (c: Context<{ Bindings: Bindings }>) => {
  const db = useDB(c);

  const body = await c.req.json().catch(() => null);

  if (!body?.id || !body.clerkId || !body.email || !body.name) {
    return c.json({ error: "id, clerkId, name, and email are required" }, 400);
  }

  const [upsertedUser] = await db
    .insert(users)
    .values({
      id: body.id,
      clerkId: body.clerkId,
      name: body.name,
      email: body.email,
      avatarUrl: body.avatarUrl ?? null,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        name: body.name,
        email: body.email,
        avatarUrl: body.avatarUrl ?? null,
        updatedAt: new Date(),
      },
    })
    .returning({
      id: users.id,
      clerkId: users.clerkId,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    });

  return c.json({ user: upsertedUser }, 200);
};
