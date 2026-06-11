import { Hono } from "hono";
import { postCreateLeanProject } from "../../controllers/projects/post-create-lean-project";
import type { Bindings, Variables } from "../../lib/common/types";

const createLeanProjectRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

createLeanProjectRoutes.post("/", postCreateLeanProject);

export default createLeanProjectRoutes;
