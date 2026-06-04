import { Hono } from "hono";
import userRoutes from "./routes/test/user.routes";
import meetingTranscriptionRouter from "./routes/meetingTranscription/meeting-transcription.routes";
import meetingRoomRouter from "./routes/meetingRoom/meeting-room.routes";
import type { Bindings } from "./lib/common/types";

const app = new Hono<{ Bindings: Bindings }>();
// test case for users route:
app.route("/users", userRoutes);

// meeting transcription routes:
app.route("/api/meeting-transcription", meetingTranscriptionRouter);

app.route("/api/meeting-room", meetingRoomRouter);

export default app;
