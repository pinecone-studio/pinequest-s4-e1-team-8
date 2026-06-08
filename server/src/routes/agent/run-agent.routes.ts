import { Hono } from "hono";
import { cors } from "hono/cors";
import { runAgent } from "../../controllers/agent/run-agent";
import { resolveAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";

const DEV_ORIGINS = ["http://localhost:3000", "http://localhost:3001"];

type HonoEnv = { Bindings: Bindings; Variables: Variables };

const runAgentRoutes = new Hono<HonoEnv>();

runAgentRoutes.use(
  cors({
    origin: (origin, c) => {
      const normalize = (value: string) => value.replace(/\/$/, "");
      const envOrigin = (c.env as Bindings).FRONTEND_URL;
      const allowed = [
        ...DEV_ORIGINS,
        ...(envOrigin ? [normalize(envOrigin)] : []),
      ];
      if (!origin) {
        return DEV_ORIGINS[0];
      }
      return allowed.includes(normalize(origin)) ? origin : DEV_ORIGINS[0];
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "OPTIONS"],
    credentials: true,
    maxAge: 86400,
  }),
);

runAgentRoutes.use(async (c, next) => {
  const userId = await resolveAuthenticatedUserId(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", userId);
  await next();
});

runAgentRoutes.post("/", runAgent);

export default runAgentRoutes;
