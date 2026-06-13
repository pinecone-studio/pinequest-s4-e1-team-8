import { Hono } from "hono";
import { cors } from "hono/cors";

import type { Bindings } from "./lib/common/types";
import meetingRoomRouter from "./routes/meetingRoom/meeting-room.routes";
import meetingsRouter from "./routes/meetings/meetings.routes";
import meetingTranscriptionRouter from "./routes/meetingTranscription/meeting-transcription.routes";
import userRoutes from "./routes/users/user.routes";
import voiceRoutes from "./routes/voice/voice.routes";
import webhookRoutes from "./routes/webhooks/webhook.routes";
import { handleMeetingTranscriptionQueue } from "./queues/meeting-transcription-queue";

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
app.route("/api/meeting-transcription", meetingTranscriptionRouter);
app.route("/api/meeting-room", meetingRoomRouter);
app.route("/api/meetings", meetingsRouter);
app.route("/api/voice", voiceRoutes);
app.route("/api/webhooks", webhookRoutes);

export default {
  fetch: app.fetch,
  queue: handleMeetingTranscriptionQueue,
};
