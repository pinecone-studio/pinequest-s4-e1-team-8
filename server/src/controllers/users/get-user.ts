import { eq } from "drizzle-orm";
import { Context } from "hono";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { users } from "../../schema/schema";

export const getUserById = async (c: Context<{ Bindings: Bindings }>) => {
  const id = c.req.param("id") as string;
  const db = useDB(c);

  const [user] = await db
    .select({
      id: users.id,
      clerkId: users.clerkId,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json({ user });
};
