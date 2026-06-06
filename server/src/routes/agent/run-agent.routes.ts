import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { runAgent } from "../../controllers/agent/run-agent";
import { verifyClerkJwt } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { users } from "../../schema/schema";
import * as schema from "../../schema/schema";

const DEV_ORIGINS = ["http://localhost:3000", "http://localhost:3001"];

type HonoEnv = { Bindings: Bindings; Variables: Variables };

const runAgentRoutes = new Hono<HonoEnv>();

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

runAgentRoutes.use(async (c, next) => {
  const auth = c.req.header("Authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const publishableKey = c.env.CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const payload = await verifyClerkJwt(token, publishableKey);
  if (!payload) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = drizzle(c.env.DB, { schema });
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, payload.sub))
    .limit(1);

  if (!result.length) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", result[0].id);
  await next();
});

runAgentRoutes.post("/", runAgent);

export default runAgentRoutes;
