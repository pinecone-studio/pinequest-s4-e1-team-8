import { Hono } from "hono";
import { getUserById } from "../../controllers/users/get-user";
import { getUsers } from "../../controllers/users/get-users";
import { createUser } from "../../controllers/users/post-user";
import { syncUser } from "../../controllers/users/post-sync-user";
import { Bindings } from "../../lib/common/types";

const userRoutes = new Hono<{ Bindings: Bindings }>();

userRoutes.get("/", getUsers);
userRoutes.post("/", createUser);
userRoutes.post("/sync", syncUser);

export default userRoutes;
