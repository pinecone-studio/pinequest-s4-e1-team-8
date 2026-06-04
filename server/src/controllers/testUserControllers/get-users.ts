import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import { usersTable } from "../../schema/schema";

export const getUsers = async (c: Context) => {
  const db = useDB(c);

  const users = await db.select().from(usersTable);

  if (users.length === 0) {
    return c.json({ message: "No users found" }, 200);
  }

  return c.json({ users: users }, 200);
};
