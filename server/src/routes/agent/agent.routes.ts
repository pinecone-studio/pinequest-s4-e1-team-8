import { Hono } from "hono";
import { runAgent } from "../../controllers/agent/run-agent";
import { Bindings } from "../../lib/common/types";

const agentRoutes = new Hono<{ Bindings: Bindings }>();

agentRoutes.post("/run", runAgent);

export default agentRoutes;
