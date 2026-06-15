import { Hono } from "hono";
import { uploadRecording } from "../../controllers/recordings/upload-recording";
import { deleteRecording } from "../../controllers/recordings/delete-recording";
import {
  getRecording,
  getRecordingAudio,
  getRecordings,
} from "../../controllers/recordings/get-recordings";
import type { Bindings, Variables } from "../../lib/common/types";

const recordingsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

recordingsRouter.post("/upload", uploadRecording);
recordingsRouter.get("/", getRecordings);
recordingsRouter.get("/:id/audio", getRecordingAudio);
recordingsRouter.get("/:id", getRecording);
recordingsRouter.delete("/:id", deleteRecording);

export default recordingsRouter;
