import { Hono } from "hono";
import { cors } from "hono/cors";

import type { Bindings } from "./lib/common/types";
import agentRoutes from "./routes/agent/agent.routes";
import agentStreamRoutes from "./routes/agent";
import runAgentRoutes from "./routes/agent/run-agent.routes";
import analyticsRoutes from "./routes/analytics/analytics.routes";
import asanaRoutes from "./routes/integrations/asana.routes";
import githubRoutes from "./routes/integrations/github.routes";
import mappingsRoutes from "./routes/mappings/mappings.routes";
import meetingRoomRouter from "./routes/meetingRoom/meeting-room.routes";
import meetingTranscriptionRouter from "./routes/meetingTranscription/meeting-transcription.routes";
import taskRoutes from "./routes/tasks/task.routes";
import userRoutes from "./routes/users/user.routes";
import webhookRoutes from "./routes/webhooks/webhook.routes";

const app = new Hono<{ Bindings: Bindings }>();

const LOCAL_ORIGIN = "http://localhost:3000";

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const normalize = (value: string) => value.replace(/\/$/, "");
      const envOrigin = (c.env as Bindings).FRONTEND_URL;
      const allowed = [
        LOCAL_ORIGIN,
        ...(envOrigin ? [normalize(envOrigin)] : []),
      ];
      if (!origin) {
        return LOCAL_ORIGIN;
      }
      return allowed.includes(normalize(origin)) ? origin : LOCAL_ORIGIN;
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: 86400,
  }),
);

app.route("/users", userRoutes);
app.route("/tasks", taskRoutes);
app.route("/integrations/github", githubRoutes);
app.route("/integrations/asana", asanaRoutes);
app.route("/analytics", analyticsRoutes);
app.route("/api/meeting-transcription", meetingTranscriptionRouter);
app.route("/api/meeting-room", meetingRoomRouter);
app.route("/api/webhooks", webhookRoutes);
app.route("/api/mappings", mappingsRoutes);
app.route("/api/agent", agentRoutes);
app.route("/api/agent/stream", agentStreamRoutes);
app.route("/api/run-agent", runAgentRoutes);

export default app;
