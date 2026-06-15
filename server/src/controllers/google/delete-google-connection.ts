import type { Context } from "hono";
import type { Bindings, Variables } from "../../lib/common/types";
import { clearGoogleTokens } from "../../lib/google/google-token.service";
import { useDB } from "../../lib/db/db";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

export const deleteGoogleConnection = async (c: Context<HonoEnv>) => {
  const userId = c.get("userId");
  await clearGoogleTokens(useDB(c), userId, c.env);
  return c.json({ ok: true });
};
