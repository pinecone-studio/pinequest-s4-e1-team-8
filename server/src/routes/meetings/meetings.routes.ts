import { Hono } from "hono";
import { getMeetingDetails } from "../../controllers/meetings/get-meeting-details";
import { getMeetings } from "../../controllers/meetings/get-meetings";

const meetingsRouter = new Hono();

meetingsRouter.get("/", getMeetings);
meetingsRouter.get("/:id/details", getMeetingDetails);

export default meetingsRouter;
