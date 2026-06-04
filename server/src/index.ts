import { Hono } from "hono";
import { Bindings } from "hono/types";
import userRoutes from "./routes/users/user.routes";

const app = new Hono<{ Bindings: Bindings }>();

app.route("/users", userRoutes);

export default app;
