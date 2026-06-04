import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import { users as usersTable } from "../../schema/schema";

export const getUsers = async (c: Context) => {
  const db = useDB(c);

  const result = await db.select().from(usersTable);

  if (result.length === 0) {
    return c.json({ message: "No users found" }, 200);
  }

  return c.json({ users: result }, 200);
};
