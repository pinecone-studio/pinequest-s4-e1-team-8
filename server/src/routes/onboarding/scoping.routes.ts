import { Hono } from "hono";
import { postScopingTurn } from "../../controllers/onboarding/scoping.controller";
import { resolveAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

const scopingRoutes = new Hono<HonoEnv>();

scopingRoutes.use(async (c, next) => {
  const userId = await resolveAuthenticatedUserId(
    c as unknown as Parameters<typeof resolveAuthenticatedUserId>[0],
  );
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", userId);
  await next();
});

scopingRoutes.post("/", postScopingTurn);

export default scopingRoutes;
