import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import { syncMappings } from "../../schema/schema";
import type { Bindings } from "../../lib/common/types";

export const createMapping = async (c: Context<{ Bindings: Bindings }>) => {
  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: "Request body is required" }, 400);
  }

  const { userId, githubRepoId, asanaProjectGid } = body as Record<
    string,
    unknown
  >;

  if (!userId || !githubRepoId || !asanaProjectGid) {
    return c.json(
      { error: "userId, githubRepoId, and asanaProjectGid are required" },
      400,
    );
  }

  const db = useDB(c);
  const [mapping] = await db
    .insert(syncMappings)
    .values({
      id: crypto.randomUUID(),
      userId: String(userId),
      githubRepoId: String(githubRepoId),
      asanaProjectGid: String(asanaProjectGid),
    })
    .returning();

  return c.json({ mapping }, 201);
};
