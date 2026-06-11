import { Hono } from "hono";
import {
  getGoogleTokens,
  getLatestOnboardingSession,
  getOnboardingSession,
  patchOnboardingSession,
  postCreateOnboardingSession,
  postGoogleOAuthComplete,
} from "../../controllers/onboarding/session.controller";
import { resolveAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

const sessionRoutes = new Hono<HonoEnv>();

sessionRoutes.post("/google/oauth/complete", postGoogleOAuthComplete);

sessionRoutes.use(async (c, next) => {
  const userId = await resolveAuthenticatedUserId(
    c as unknown as Parameters<typeof resolveAuthenticatedUserId>[0],
  );
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", userId);
  await next();
});

sessionRoutes.get("/google/tokens", getGoogleTokens);
sessionRoutes.get("/latest", getLatestOnboardingSession);
sessionRoutes.post("/", postCreateOnboardingSession);
sessionRoutes.get("/:sessionId", getOnboardingSession);
sessionRoutes.patch("/:sessionId", patchOnboardingSession);

export default sessionRoutes;
