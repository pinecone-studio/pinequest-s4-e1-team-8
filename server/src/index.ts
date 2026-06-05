import { Hono } from "hono";
import { cors } from "hono/cors";

import type { Bindings } from "./lib/common/types";
import analyticsRoutes from "./routes/analytics/analytics.routes";
import githubRoutes from "./routes/integrations/github.routes";
import taskRoutes from "./routes/tasks/task.routes";
import userRoutes from "./routes/users/user.routes";
import meetingTranscriptionRouter from "./routes/meetingTranscription/meeting-transcription.routes";
import meetingRoomRouter from "./routes/meetingRoom/meeting-room.routes";
import webhookRoutes from "./routes/webhooks/webhook.routes";
import mappingsRoutes from "./routes/mappings/mappings.routes";

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/api/*",
  cors({
    origin: (_, c) =>
      (c.env as Bindings).FRONTEND_URL ?? "http://localhost:3000",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: 86400,
  }),
);

app.route("/users", userRoutes);
app.route("/tasks", taskRoutes);
app.route("/integrations/github", githubRoutes);
app.route("/analytics", analyticsRoutes);
app.route("/api/meeting-transcription", meetingTranscriptionRouter);
app.route("/api/meeting-room", meetingRoomRouter);
app.route("/api/webhooks", webhookRoutes);
app.route("/api/mappings", mappingsRoutes);

export default app;
