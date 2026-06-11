import type { Context } from "hono";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import {
  ProvisionProjectError,
  provisionProject,
} from "../../lib/projects/provision-project.service";
import { validateProvisionProject } from "../../lib/projects/validate-provision-payload";

export async function postProvisionProject(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) {
  const userId = await getAuthenticatedUserId(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const validation = validateProvisionProject(body);
  if (!validation.ok) {
    return c.json({ error: validation.error, field: validation.field }, 400);
  }

  const db = useDB(c);

  try {
    const result = await provisionProject(db, userId, validation.data);
    return c.json({ project: result }, 201);
  } catch (error) {
    if (error instanceof ProvisionProjectError) {
      return c.json(
        { error: error.message, field: error.field ?? null },
        error.status as 400 | 409,
      );
    }

    console.error("[provision-project] failed:", error);
    return c.json({ error: "Failed to provision project" }, 500);
  }
}
