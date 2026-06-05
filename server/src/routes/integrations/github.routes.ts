import { Hono } from "hono";
import {
  getGithubCallback,
  getGithubConnect,
  postGithubSync,
} from "../../controllers/integrations/github";
import { Bindings } from "../../lib/common/types";

const githubRoutes = new Hono<{ Bindings: Bindings }>();

githubRoutes.get("/connect", getGithubConnect);
githubRoutes.get("/callback", getGithubCallback);
githubRoutes.post("/sync", postGithubSync);

export default githubRoutes;
