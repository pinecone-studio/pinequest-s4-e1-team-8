import { Hono } from "hono";
import { getOnboardingVoiceStatus } from "../../controllers/users/get-onboarding-voice-status";
import { getUserById } from "../../controllers/users/get-user";
import { getUsers } from "../../controllers/users/get-users";
import { postOnboardingVoice } from "../../controllers/users/post-onboarding-voice";
import { createUser } from "../../controllers/users/post-user";
import { syncUser } from "../../controllers/users/post-sync-user";
import { resolveAuthenticatedUserId } from "../../lib/auth/clerk";
import { useDB } from "../../lib/db/db";
import { ensureDevVoiceUser } from "../../lib/voice/dev-user";
import type { Bindings, Variables } from "../../lib/common/types";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

const userRoutes = new Hono<HonoEnv>();

userRoutes.get("/", getUsers);
userRoutes.post("/", createUser);
userRoutes.post("/sync", syncUser);

const onboardingRoutes = new Hono<HonoEnv>();

onboardingRoutes.use(async (c, next) => {
  let userId = await resolveAuthenticatedUserId(c);

  if (!userId && c.env.VOICE_DEV_BYPASS === "true") {
    userId = await ensureDevVoiceUser(useDB(c));
  }

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", userId);
  await next();
});

onboardingRoutes.get("/voice-status", getOnboardingVoiceStatus);
onboardingRoutes.post("/voice", postOnboardingVoice);

userRoutes.route("/onboarding", onboardingRoutes);

export default userRoutes;
