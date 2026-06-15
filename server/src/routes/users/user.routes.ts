import { Hono } from "hono";
import { getUsers } from "../../controllers/users/get-users";
import { createUser } from "../../controllers/users/post-user";
import { syncUser } from "../../controllers/users/post-sync-user";
import type { Bindings, Variables } from "../../lib/common/types";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

const userRoutes = new Hono<HonoEnv>();

userRoutes.get("/", getUsers);
userRoutes.post("/", createUser);
userRoutes.post("/sync", syncUser);

export default userRoutes;
