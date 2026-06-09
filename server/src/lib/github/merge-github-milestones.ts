import type { GithubIssue, GithubMilestone } from "./github";

export function mergeGithubMilestones(
  milestones: GithubMilestone[],
  issues: GithubIssue[],
): GithubMilestone[] {
  const merged = new Map<number, GithubMilestone>();

  for (const milestone of milestones) {
    merged.set(milestone.number, milestone);
  }

  for (const issue of issues) {
    if (!issue.milestone || merged.has(issue.milestone.number)) {
      continue;
    }

    merged.set(issue.milestone.number, {
      number: issue.milestone.number,
      title: issue.milestone.title,
      description: null,
      state: "closed",
      due_on: null,
      open_issues: 0,
      closed_issues: 0,
    });
  }

  return Array.from(merged.values());
}
