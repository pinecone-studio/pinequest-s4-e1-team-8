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
import taskSyncRoutes from "./routes/integrations/sync";
import mappingsRoutes from "./routes/mappings/mappings.routes";
import meetingRoomRouter from "./routes/meetingRoom/meeting-room.routes";
import meetingTranscriptionRouter from "./routes/meetingTranscription/meeting-transcription.routes";
import onboardingScopingRoutes from "./routes/onboarding/scoping.routes";
import onboardingChatRoutes from "./routes/onboarding/chat.routes";
import onboardingRefineRoutes from "./routes/onboarding/refine.routes";
import onboardingSessionRoutes from "./routes/onboarding/session.routes";
import onboardingProvisionRoutes from "./routes/onboarding/provision.routes";
import createLeanProjectRoutes from "./routes/projects/create-lean";
import initializeProjectRoutes from "./routes/projects/initialize";
import projectRoutes from "./routes/projects/project.routes";
import reportStreamRoutes from "./routes/reports/stream";
import riskAnalyzeRoutes from "./routes/risk/analyze";
import taskReorderRoutes from "./routes/tasks/reorder";
import taskRoutes from "./routes/tasks/task.routes";
import reorderRoutes from "./routes/tasks/reorder";
import userRoutes from "./routes/users/user.routes";
import voiceRoutes from "./routes/voice/voice.routes";
import webhookRoutes from "./routes/webhooks/webhook.routes";

const app = new Hono<{ Bindings: Bindings }>();
const DEPLOYED_CLIENT_ORIGIN =
  "https://brisk-client.danny-otgontsetseg.workers.dev";
const LOCAL_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
];

const getAllowedOrigins = (env: Bindings) =>
  [...LOCAL_ORIGINS, env.FRONTEND_URL, env.CLIENT_APP_URL, DEPLOYED_CLIENT_ORIGIN]
    .filter((origin): origin is string => Boolean(origin))
    .map((origin) => origin.replace(/\/$/, ""));

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const normalize = (value: string) => value.replace(/\/$/, "");
      const allowedOrigins = getAllowedOrigins(c.env as Bindings);
      if (!origin) {
        return LOCAL_ORIGINS[0];
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
app.route("/api/integrations/sync-task", taskSyncRoutes);
app.route("/analytics", analyticsRoutes);
app.route("/api/analytics", analyticsMetricsRoutes);
app.route("/api/meeting-transcription", meetingTranscriptionRouter);
app.route("/api/meeting-room", meetingRoomRouter);
app.route("/api/voice", voiceRoutes);
app.route("/api/webhooks", webhookRoutes);
app.route("/api/mappings", mappingsRoutes);
app.route("/api/agent", agentRoutes);
app.route("/api/agent/stream", agentStreamRoutes);
app.route("/api/run-agent", runAgentRoutes);
app.route("/api/onboarding/scoping", onboardingScopingRoutes);
app.route("/api/onboarding/chat", onboardingChatRoutes);
app.route("/api/onboarding/refine-selection", onboardingRefineRoutes);
app.route("/api/onboarding/sessions", onboardingSessionRoutes);
app.route("/api/onboarding", onboardingProvisionRoutes);
app.route("/api/projects/initialize", initializeProjectRoutes);
app.route("/api/projects/create-lean", createLeanProjectRoutes);
app.route("/api/reports/stream", reportStreamRoutes);
app.route("/api/tasks", reorderRoutes);

export default app;
