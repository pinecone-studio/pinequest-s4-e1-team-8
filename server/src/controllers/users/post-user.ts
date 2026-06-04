import { Context } from "hono";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { users } from "../../schema/schema";

export const createUser = async (c: Context<{ Bindings: Bindings }>) => {
  const db = useDB(c);

  const body = await c.req.json().catch(() => null);

  if (!body) {
    return c.json({ error: "Body is required" }, 400);
  }

  const [newUser] = await db
    .insert(users)
    .values({
      id: body.id,
      clerkId: body.clerkId,
      name: body.name,
      email: body.email,
      avatarUrl: body.avatarUrl,
    })
    .returning({
      id: users.id,
      clerkId: users.clerkId,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    });

  return c.json({ new_user: newUser }, 201);
};
