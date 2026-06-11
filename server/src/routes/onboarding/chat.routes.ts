import { Hono } from "hono";
import { postOnboardingChat } from "../../controllers/onboarding/chat.controller";
import { resolveAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

const chatRoutes = new Hono<HonoEnv>();

chatRoutes.use(async (c, next) => {
  const userId = await resolveAuthenticatedUserId(
    c as unknown as Parameters<typeof resolveAuthenticatedUserId>[0],
  );
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", userId);
  await next();
});

chatRoutes.post("/", postOnboardingChat);

export default chatRoutes;
