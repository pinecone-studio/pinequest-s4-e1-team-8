import { Hono } from "hono";
import { cors } from "hono/cors";

import meetingTranscriptionRouter from "./routes/meetingTranscription/meeting-transcription.routes";
import meetingRoomRouter from "./routes/meetingRoom/meeting-room.routes";
import type { Bindings } from "./lib/common/types";
import githubRoutes from "./routes/integrations/github.routes";
import userRoutes from "./routes/users/user.routes";
import taskRoutes from "./routes/tasks/task.routes";

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    credentials: true,
  }),
);

app.route("/users", userRoutes);
app.route("/tasks", taskRoutes);
app.route("/integrations/github", githubRoutes);


app.route("/api/meeting-transcription", meetingTranscriptionRouter);

app.route("/api/meeting-room", meetingRoomRouter);

export default app;
