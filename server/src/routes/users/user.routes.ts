import { Hono } from "hono";
import { getUsers } from "../../controllers/users/get-users";
import { createUser } from "../../controllers/users/post-user";
import { Bindings } from "../../lib/common/types";

const userRoutes = new Hono<{ Bindings: Bindings }>();

userRoutes.get("/", getUsers);
userRoutes.post("/", createUser);

export default userRoutes;
