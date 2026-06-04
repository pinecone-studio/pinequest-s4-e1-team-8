import { Context } from "hono";
import { Bindings } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { usersTable } from "../../schema/schema";

export const createUser = async (c: Context<{ Bindings: Bindings }>) => {
  const db = useDB(c);

  const body = await c.req.json().catch(() => null);

  if (!body) {
    return c.json({ error: "Body is required" }, 400);
  }

  const [newUser] = await db
    .insert(usersTable)
    .values({
      id: body.id,
      role: body.role,
      name: body.name,
      email: body.email,
      password: body.password,
      age: body.age,
      tel: body.tel,
    })
    .returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      age: usersTable.age,
      tel: usersTable.tel,
    });

  return c.json({ new_user: newUser }, 201);
};
