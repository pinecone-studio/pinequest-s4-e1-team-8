import { Hono } from "hono";
import {
  getAsanaProjects,
  getAsanaStatus,
  getAsanaWorkspaces,
  postAsanaCreateProject,
  postAsanaDisconnect,
  postAsanaOAuthComplete,
  postAsanaPAT,
  postAsanaSelectProject,
  postAsanaSync,
} from "../../controllers/integrations/asana";
import { Bindings } from "../../lib/common/types";

const asanaRoutes = new Hono<{ Bindings: Bindings }>();

asanaRoutes.get("/status", getAsanaStatus);
asanaRoutes.post("/oauth/complete", postAsanaOAuthComplete);
asanaRoutes.post("/pat", postAsanaPAT);
asanaRoutes.post("/disconnect", postAsanaDisconnect);
asanaRoutes.get("/workspaces", getAsanaWorkspaces);
asanaRoutes.get("/projects", getAsanaProjects);
asanaRoutes.post("/projects/create", postAsanaCreateProject);
asanaRoutes.post("/project", postAsanaSelectProject);
asanaRoutes.post("/sync", postAsanaSync);

export default asanaRoutes;
