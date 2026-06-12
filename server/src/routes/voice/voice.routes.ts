import { Hono } from "hono";
import { getVoiceStatus } from "../../controllers/voice/get-voice-status";
import { postVoiceEnroll } from "../../controllers/voice/post-voice-enroll";
import { postVoiceVerify } from "../../controllers/voice/post-voice-verify";
import { resolveAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

const voiceRoutes = new Hono<HonoEnv>();

voiceRoutes.use(async (c, next) => {
  const userId = await resolveAuthenticatedUserId(
    c as unknown as Parameters<typeof resolveAuthenticatedUserId>[0],
  );

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", userId);
  await next();
});

voiceRoutes.get("/status", getVoiceStatus);
voiceRoutes.post("/enroll", postVoiceEnroll);
voiceRoutes.post("/verify", postVoiceVerify);

export default voiceRoutes;
