import { Hono } from "hono";
import type { Bindings } from "../../lib/common/types";
import { getMappings } from "../../controllers/mappings/get-mappings";
import { createMapping } from "../../controllers/mappings/post-mapping";

const mappingsRoutes = new Hono<{ Bindings: Bindings }>();

mappingsRoutes.get("/", getMappings);
mappingsRoutes.post("/", createMapping);

export default mappingsRoutes;
