import { Hono } from "hono";
import { postRefineSelection } from "../../controllers/onboarding/refine.controller";
import { resolveAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

const refineRoutes = new Hono<HonoEnv>();

refineRoutes.use(async (c, next) => {
  const userId = await resolveAuthenticatedUserId(
    c as unknown as Parameters<typeof resolveAuthenticatedUserId>[0],
  );
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", userId);
  await next();
});

refineRoutes.post("/", postRefineSelection);

export default refineRoutes;
