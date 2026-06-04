import { Hono } from "hono";
import { Bindings } from "hono/types";
import userRoutes from "./routes/test/user.routes";

const app = new Hono<{ Bindings: Bindings }>();

// test case for users route:
app.route("/users", userRoutes);

export default app;
