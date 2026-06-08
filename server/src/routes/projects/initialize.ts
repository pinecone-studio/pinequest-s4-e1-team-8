import { Hono } from "hono";
import { initializeProject } from "../../controllers/projects/initialize-project";
import { resolveAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

const initializeProjectRoutes = new Hono<HonoEnv>();

initializeProjectRoutes.use(async (c, next) => {
  const userId = await resolveAuthenticatedUserId(c);
  if (!userId) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  c.set("userId", userId);
  await next();
});

initializeProjectRoutes.post("/", initializeProject);

export default initializeProjectRoutes;
