import type { Context } from "hono";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { listProjectIntegrations } from "../../lib/projects/provision-project.service";

export async function getIntegrationMappings(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) {
  const userId = await getAuthenticatedUserId(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = useDB(c);
  const mappings = await listProjectIntegrations(db, userId);
  return c.json({ mappings });
}
