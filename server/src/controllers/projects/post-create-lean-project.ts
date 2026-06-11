import type { Context } from "hono";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import {
  CreateLeanProjectError,
  createLeanProject,
} from "../../lib/projects/create-lean-project.service";
import { validateCreateLeanProject } from "../../lib/projects/validate-create-lean-project";

export async function postCreateLeanProject(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) {
  const userId = await getAuthenticatedUserId(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const validation = validateCreateLeanProject(body);
  if (!validation.ok) {
    return c.json({ error: validation.error }, 400);
  }

  const db = useDB(c);

  try {
    const result = await createLeanProject(
      db,
      userId,
      validation.data,
      c.env.CLIENT_APP_URL ?? c.env.FRONTEND_URL,
    );

    return c.json(result, 201);
  } catch (error) {
    if (error instanceof CreateLeanProjectError) {
      return c.json({ error: error.message }, error.status as 400 | 409);
    }

    console.error("[create-lean] failed:", error);
    return c.json({ error: "Failed to create project" }, 500);
  }
}
