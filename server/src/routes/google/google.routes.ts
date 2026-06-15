import { Hono } from "hono";
import { deleteGoogleConnection } from "../../controllers/google/delete-google-connection";
import { getCalendarAgenda } from "../../controllers/google/get-calendar-agenda";
import { getGoogleStatus } from "../../controllers/google/get-google-status";
import { postGoogleOAuthComplete } from "../../controllers/google/post-google-oauth-complete";
import { resolveAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import { ensureDevVoiceUser } from "../../lib/voice/dev-user";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

const googleRoutes = new Hono<HonoEnv>();

googleRoutes.use(async (c, next) => {
  let userId = await resolveAuthenticatedUserId(
    c as unknown as Parameters<typeof resolveAuthenticatedUserId>[0],
  );

  if (!userId && c.env.VOICE_DEV_BYPASS === "true") {
    userId = await ensureDevVoiceUser(useDB(c));
  }

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", userId);
  await next();
});

googleRoutes.get("/status", getGoogleStatus);
googleRoutes.get("/calendar/agenda", getCalendarAgenda);
googleRoutes.post("/oauth/complete", postGoogleOAuthComplete);
googleRoutes.delete("/disconnect", deleteGoogleConnection);

export default googleRoutes;
