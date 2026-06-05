import { Hono } from "hono";
import type { Bindings } from "../../lib/common/types";
import { githubWebhook } from "../../controllers/webhooks/github-webhook";

const webhookRoutes = new Hono<{ Bindings: Bindings }>();

webhookRoutes.post("/github", githubWebhook);

export default webhookRoutes;
