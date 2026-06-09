import { Hono } from "hono";
import { cors } from "hono/cors";

import type { Bindings } from "./lib/common/types";
import agentRoutes from "./routes/agent/agent.routes";
import agentStreamRoutes from "./routes/agent";
import runAgentRoutes from "./routes/agent/run-agent.routes";
import analyticsRoutes from "./routes/analytics/analytics.routes";
import analyticsMetricsRoutes from "./routes/analytics/metrics";
import asanaRoutes from "./routes/integrations/asana.routes";
import githubRoutes from "./routes/integrations/github.routes";
import mappingsRoutes from "./routes/mappings/mappings.routes";
import meetingRoomRouter from "./routes/meetingRoom/meeting-room.routes";
import meetingTranscriptionRouter from "./routes/meetingTranscription/meeting-transcription.routes";
import initializeProjectRoutes from "./routes/projects/initialize";
import projectRoutes from "./routes/projects/project.routes";
import reportStreamRoutes from "./routes/reports/stream";
import riskAnalyzeRoutes from "./routes/risk/analyze";
import taskRoutes from "./routes/tasks/task.routes";
import userRoutes from "./routes/users/user.routes";
import webhookRoutes from "./routes/webhooks/webhook.routes";

const app = new Hono<{ Bindings: Bindings }>();
const DEPLOYED_CLIENT_ORIGIN =
  "https://brisk-client.danny-otgontsetseg.workers.dev";
const LOCAL_ORIGIN = "http://localhost:3000";

const getAllowedOrigins = (env: Bindings) =>
  [LOCAL_ORIGIN, env.FRONTEND_URL, env.CLIENT_APP_URL, DEPLOYED_CLIENT_ORIGIN]
    .filter((origin): origin is string => Boolean(origin))
    .map((origin) => origin.replace(/\/$/, ""));

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const normalize = (value: string) => value.replace(/\/$/, "");
      const allowedOrigins = getAllowedOrigins(c.env as Bindings);
      if (!origin) {
        return LOCAL_ORIGIN;
      }
      return allowedOrigins.includes(normalize(origin))
        ? origin
        : allowedOrigins[0];
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: 86400,
  }),
);

app.route("/users", userRoutes);
app.route("/projects", projectRoutes);
app.route("/tasks", taskRoutes);
app.route("/integrations/github", githubRoutes);
app.route("/integrations/asana", asanaRoutes);
app.route("/analytics", analyticsRoutes);
app.route("/api/analytics", analyticsMetricsRoutes);
app.route("/api/meeting-transcription", meetingTranscriptionRouter);
app.route("/api/meeting-room", meetingRoomRouter);
app.route("/api/webhooks", webhookRoutes);
app.route("/api/mappings", mappingsRoutes);
app.route("/api/agent", agentRoutes);
app.route("/api/agent/stream", agentStreamRoutes);
app.route("/api/run-agent", runAgentRoutes);
app.route("/api/projects/initialize", initializeProjectRoutes);
app.route("/api/reports/stream", reportStreamRoutes);
app.route("/api/risk/analyze", riskAnalyzeRoutes);

export default app;
