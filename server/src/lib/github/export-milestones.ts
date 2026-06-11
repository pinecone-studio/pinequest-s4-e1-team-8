import {
  createGithubIssue,
  createRepoMilestone,
} from "./github";
import { addProjectItemById } from "./projects";

export type MilestoneExportInput = {
  title: string;
  tasks: string[];
};

export type MilestoneExportResult = {
  milestonesCreated: number;
  issuesCreated: number;
  projectItemsAdded: number;
  issues: Array<{ number: number; title: string; html_url: string; milestoneTitle: string }>;
};

export async function exportMilestonesToGithubProject(
  accessToken: string,
  owner: string,
  repo: string,
  githubProjectId: string,
  milestones: MilestoneExportInput[],
): Promise<MilestoneExportResult> {
  const issues: MilestoneExportResult["issues"] = [];
  let milestonesCreated = 0;
  let issuesCreated = 0;
  let projectItemsAdded = 0;

  for (const milestone of milestones) {
    const title = milestone.title.trim();
    if (!title) {
      continue;
    }

    const ghMilestone = await createRepoMilestone(accessToken, owner, repo, {
      title,
      description: `Milestone exported from Brisk onboarding.`,
    });
    milestonesCreated += 1;

    for (const taskTitle of milestone.tasks) {
      const trimmedTask = taskTitle.trim();
      if (!trimmedTask) {
        continue;
      }

      const issue = await createGithubIssue(
        accessToken,
        owner,
        repo,
        trimmedTask,
        `Part of milestone **${title}**.\n\n_Created by Brisk._`,
        { milestone: ghMilestone.number },
      );
      issuesCreated += 1;

      await addProjectItemById(accessToken, githubProjectId, issue.node_id);
      projectItemsAdded += 1;

      issues.push({
        number: issue.number,
        title: issue.title,
        html_url: issue.html_url,
        milestoneTitle: title,
      });
    }
  }

  return {
    milestonesCreated,
    issuesCreated,
    projectItemsAdded,
    issues,
  };
}
