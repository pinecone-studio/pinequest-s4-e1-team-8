import { Hono } from "hono";
import {
  getGithubBranches,
  getGithubIssueComments,
  getGithubIssueDetail,
  getGithubIssues,
  getGithubLabels,
  getGithubMilestones,
  postGithubMilestone,
  getGithubAssignees,
  getGithubPullChecks,
  getGithubPullComments,
  getGithubPullCommits,
  getGithubPullDetail,
  getGithubPullFiles,
  getGithubPulls,
  getGithubRepos,
  getGithubStatus,
  patchGithubIssue,
  patchGithubPull,
  postGithubGeneratePrMessage,
  postGithubIssue,
  postGithubIssueComment,
  postGithubMergePull,
  postGithubPull,
  postGithubPullComment,
  postGithubPullReview,
  postGithubPullReviewers,
  postGithubSync,
  getGithubProjects,
  getGithubProjectDetail,
  postGithubProjectItem,
  patchGithubProjectItem,
  postGithubPAT,
  postGithubDisconnect,
  postGithubOAuthComplete,
  patchGithubSettings,
  postGithubRepo,
  postGithubProject,
  postGithubExportMilestones,
} from "../../controllers/integrations/github";
import { Bindings } from "../../lib/common/types";

const githubRoutes = new Hono<{ Bindings: Bindings }>();

githubRoutes.get("/status", getGithubStatus);
githubRoutes.get("/repos", getGithubRepos);
githubRoutes.get("/branches", getGithubBranches);
githubRoutes.get("/labels", getGithubLabels);
githubRoutes.get("/milestones", getGithubMilestones);
githubRoutes.post("/milestones", postGithubMilestone);
githubRoutes.get("/assignees", getGithubAssignees);
githubRoutes.get("/pulls", getGithubPulls);
githubRoutes.get("/pulls/detail", getGithubPullDetail);
githubRoutes.get("/pulls/files", getGithubPullFiles);
githubRoutes.get("/pulls/commits", getGithubPullCommits);
githubRoutes.get("/pulls/comments", getGithubPullComments);
githubRoutes.get("/pulls/checks", getGithubPullChecks);
githubRoutes.get("/issues", getGithubIssues);
githubRoutes.get("/issues/detail", getGithubIssueDetail);
githubRoutes.get("/issues/comments", getGithubIssueComments);
githubRoutes.post("/issues", postGithubIssue);
githubRoutes.post("/issues/comment", postGithubIssueComment);
githubRoutes.patch("/issues", patchGithubIssue);
githubRoutes.post("/pulls", postGithubPull);
githubRoutes.post("/pulls/merge", postGithubMergePull);
githubRoutes.post("/pulls/comment", postGithubPullComment);
githubRoutes.post("/pulls/review", postGithubPullReview);
githubRoutes.post("/pulls/reviewers", postGithubPullReviewers);
githubRoutes.post("/pulls/generate", postGithubGeneratePrMessage);
githubRoutes.patch("/pulls", patchGithubPull);
githubRoutes.post("/sync", postGithubSync);

githubRoutes.post("/pat", postGithubPAT);
githubRoutes.post("/oauth/complete", postGithubOAuthComplete);
githubRoutes.post("/disconnect", postGithubDisconnect);
githubRoutes.patch("/settings", patchGithubSettings);
githubRoutes.post("/repos/create", postGithubRepo);
githubRoutes.post("/projects/create", postGithubProject);
githubRoutes.post("/export-milestones", postGithubExportMilestones);
githubRoutes.get("/projects", getGithubProjects);
githubRoutes.get("/projects/detail", getGithubProjectDetail);
githubRoutes.post("/projects/items", postGithubProjectItem);
githubRoutes.patch("/projects/items", patchGithubProjectItem);

export default githubRoutes;
