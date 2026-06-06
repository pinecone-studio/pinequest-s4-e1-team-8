import { Hono } from "hono";
import { cors } from "hono/cors";
import { runAgent } from "../../controllers/agent/run-agent";
import type { Bindings } from "../../lib/common/types";

const DEV_ORIGINS = ["http://localhost:3000", "http://localhost:3001"];

const runAgentRoutes = new Hono<{ Bindings: Bindings }>();

runAgentRoutes.use(
  cors({
    origin: (origin, c) => {
      const envOrigin = (c.env as Bindings).FRONTEND_URL;
      const allowed = envOrigin ? [envOrigin, ...DEV_ORIGINS] : DEV_ORIGINS;
      return allowed.includes(origin) ? origin : DEV_ORIGINS[0];
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "OPTIONS"],
    credentials: true,
    maxAge: 86400,
  }),
);

runAgentRoutes.post("/", runAgent);

export default runAgentRoutes;
