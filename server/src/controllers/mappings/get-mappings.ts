import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import { syncMappings } from "../../schema/schema";
import type { Bindings } from "../../lib/common/types";

export const getMappings = async (c: Context<{ Bindings: Bindings }>) => {
  const db = useDB(c);
  const mappings = await db.select().from(syncMappings);
  return c.json({ mappings }, 200);
};
