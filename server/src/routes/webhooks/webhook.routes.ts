import { Hono } from "hono";
import type { Bindings } from "../../lib/common/types";
import { clerkWebhook } from "../../controllers/webhooks/clerk-webhook";

const webhookRoutes = new Hono<{ Bindings: Bindings }>();

webhookRoutes.post("/clerk", clerkWebhook);

export default webhookRoutes;
