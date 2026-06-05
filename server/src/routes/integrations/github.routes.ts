import { Hono } from "hono";
import {
  getGithubBranches,
  getGithubCallback,
  getGithubConnect,
  getGithubIssueComments,
  getGithubIssueDetail,
  getGithubIssues,
  getGithubLabels,
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
} from "../../controllers/integrations/github";
import { Bindings } from "../../lib/common/types";

const githubRoutes = new Hono<{ Bindings: Bindings }>();

githubRoutes.get("/connect", getGithubConnect);
githubRoutes.get("/callback", getGithubCallback);
githubRoutes.get("/status", getGithubStatus);
githubRoutes.get("/repos", getGithubRepos);
githubRoutes.get("/branches", getGithubBranches);
githubRoutes.get("/labels", getGithubLabels);
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

export default githubRoutes;
