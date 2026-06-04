import { Hono } from "hono";

import meetingTranscriptionRouter from "./routes/meetingTranscription/meeting-transcription.routes";
import meetingRoomRouter from "./routes/meetingRoom/meeting-room.routes";
import type { Bindings } from "./lib/common/types";
import userRoutes from "./routes/users/user.routes";
import taskRoutes from "./routes/tasks/task.routes";

const app = new Hono<{ Bindings: Bindings }>();

app.route("/users", userRoutes);
app.route("/tasks", taskRoutes);


app.route("/api/meeting-transcription", meetingTranscriptionRouter);

app.route("/api/meeting-room", meetingRoomRouter);

export default app;
