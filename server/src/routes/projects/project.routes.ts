import { Hono } from "hono";
import { getInvitePreview } from "../../controllers/projects/get-invite-preview";
import { getMyProjects } from "../../controllers/projects/get-my-projects";
import { getProjectMembers } from "../../controllers/projects/get-project-members";
import { getSubTeams } from "../../controllers/projects/get-sub-teams";
import { postAcceptInvite } from "../../controllers/projects/post-accept-invite";
import { postInitializeProject } from "../../controllers/projects/post-initialize-project";
import { postSubTeam } from "../../controllers/projects/post-sub-team";
import { postSubTeamMember } from "../../controllers/projects/post-sub-team-member";
import type { Bindings, Variables } from "../../lib/common/types";

const projectRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

projectRoutes.post("/initialize", postInitializeProject);
projectRoutes.get("/me", getMyProjects);
projectRoutes.get("/:projectId/members", getProjectMembers);
projectRoutes.get("/:projectId/sub-teams", getSubTeams);
projectRoutes.post("/:projectId/sub-teams", postSubTeam);
projectRoutes.post("/sub-teams/:subTeamId/members", postSubTeamMember);
projectRoutes.get("/invite/:token", getInvitePreview);
projectRoutes.post("/invite/:token/accept", postAcceptInvite);

export default projectRoutes;
