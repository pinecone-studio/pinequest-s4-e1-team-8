import { Hono } from "hono";
import {
  getAsanaProjects,
  getAsanaStatus,
  getAsanaWorkspaces,
  postAsanaDisconnect,
  postAsanaOAuthComplete,
  postAsanaSelectProject,
  postAsanaSync,
} from "../../controllers/integrations/asana";
import { Bindings } from "../../lib/common/types";

const asanaRoutes = new Hono<{ Bindings: Bindings }>();

asanaRoutes.get("/status", getAsanaStatus);
asanaRoutes.post("/oauth/complete", postAsanaOAuthComplete);
asanaRoutes.post("/disconnect", postAsanaDisconnect);
asanaRoutes.get("/workspaces", getAsanaWorkspaces);
asanaRoutes.get("/projects", getAsanaProjects);
asanaRoutes.post("/project", postAsanaSelectProject);
asanaRoutes.post("/sync", postAsanaSync);

export default asanaRoutes;
