import { Hono } from "hono";
import type { Bindings } from "../../lib/common/types";
import { clerkWebhook } from "../../controllers/webhooks/clerk-webhook";
import { githubWebhook } from "../../controllers/webhooks/github-webhook";

const webhookRoutes = new Hono<{ Bindings: Bindings }>();

webhookRoutes.post("/github", githubWebhook);
webhookRoutes.post("/clerk", clerkWebhook);

export default webhookRoutes;
