import { Hono } from "hono";
import { getIntegrationMappings } from "../../controllers/onboarding/get-integration-mappings";
import { postProvisionProject } from "../../controllers/projects/post-provision-project";
import type { Bindings, Variables } from "../../lib/common/types";

const provisionRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

provisionRoutes.get("/integration-mappings", getIntegrationMappings);
provisionRoutes.post("/provision", postProvisionProject);

export default provisionRoutes;
