import { Hono } from "hono";
import { cors } from "hono/cors";
import { runAgent } from "../../controllers/agent/run-agent";
import { resolveAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";

const DEPLOYED_CLIENT_ORIGIN =
  "https://brisk-client.danny-otgontsetseg.workers.dev";
const DEV_ORIGINS = ["http://localhost:3000", "http://localhost:3001"];

type HonoEnv = { Bindings: Bindings; Variables: Variables };

const runAgentRoutes = new Hono<HonoEnv>();

runAgentRoutes.use(
  cors({
    origin: (origin, c) => {
      const normalize = (value: string) => value.replace(/\/$/, "");
      const env = c.env as Bindings;
      const allowed = [
        ...DEV_ORIGINS,
        env.FRONTEND_URL,
        env.CLIENT_APP_URL,
        DEPLOYED_CLIENT_ORIGIN,
      ]
        .filter((allowedOrigin): allowedOrigin is string =>
          Boolean(allowedOrigin),
        )
        .map((allowedOrigin) => allowedOrigin.replace(/\/$/, ""));
      if (!origin) {
        return DEV_ORIGINS[0];
      }
      return allowed.includes(normalize(origin)) ? origin : allowed[0];
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "OPTIONS"],
    credentials: true,
    maxAge: 86400,
  }),
);

runAgentRoutes.use(async (c, next) => {
  const userId = await resolveAuthenticatedUserId(
    c as unknown as Parameters<typeof resolveAuthenticatedUserId>[0],
  );
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", userId);
  await next();
});

runAgentRoutes.post("/", runAgent);

export default runAgentRoutes;
