import { Hono } from "hono";
import { postCreateRoom } from "../../controllers/meetingRoom/post-create-room";
import { postJoinRoom } from "../../controllers/meetingRoom/post-join-room";

const meetingRoomRouter = new Hono();

meetingRoomRouter.post("/create", postCreateRoom);
meetingRoomRouter.post("/join", postJoinRoom);
meetingRoomRouter.post("/join-room", postJoinRoom);

export default meetingRoomRouter;
