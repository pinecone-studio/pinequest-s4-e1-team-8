import { Hono } from "hono";
import { postMeetingSummary } from "../../controllers/meetingTranscription/post-meeting-summary";
import { getMeetingTranscript } from "../../controllers/meetingTranscription/get-meeting-transcript";
import { startEgress } from "../../controllers/meetingTranscription/start-egress";
import { liveKitWebhook } from "../../controllers/meetingTranscription/livekit-webhook";

const meetingTranscriptionRouter = new Hono();

meetingTranscriptionRouter.post("/start-egress", startEgress);
meetingTranscriptionRouter.post("/livekit-webhook", liveKitWebhook);
meetingTranscriptionRouter.post("/summary", postMeetingSummary);
meetingTranscriptionRouter.get("/:id", getMeetingTranscript);

export default meetingTranscriptionRouter;
