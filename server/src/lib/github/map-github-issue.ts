import type { NewTask } from "../../schema/task.model";
import type { GithubIssue, GithubMilestone } from "./github";
import { DEFAULT_PROJECT_ID, DEFAULT_WORKSPACE_ID } from "../tasks/task-defaults";
import { serializeMembers } from "../tasks/task-mapper";

const MAX_DESCRIPTION_LENGTH = 500;

function trimDescription(body: string | null): string | null {
  if (!body) return null;
  return body.length > MAX_DESCRIPTION_LENGTH
    ? `${body.slice(0, MAX_DESCRIPTION_LENGTH)}…`
    : body;
}

export function githubMilestoneTaskId(
  owner: string,
  repo: string,
  number: number,
): string {
  return `github-milestone-${owner}-${repo}-${number}`;
}

export function mapGithubMilestoneToTask(
  milestone: GithubMilestone,
  owner: string,
  repo: string,
  projectId: string = DEFAULT_PROJECT_ID,
  workspaceId: string = DEFAULT_WORKSPACE_ID,
): NewTask {
  const total = milestone.open_issues + milestone.closed_issues;
  const progress =
    total === 0
      ? 0
      : Math.round((milestone.closed_issues / total) * 100);
  const closed = milestone.state === "closed";

  return {
    id: githubMilestoneTaskId(owner, repo, milestone.number),
    workspaceId,
    projectId,
    subTeamId: null,
    assigneeId: null,
    parentId: null,
    title: milestone.title,
    description: trimDescription(milestone.description),
    status: closed ? "DONE" : "IN_PROGRESS",
    priority: "MEDIUM",
    source: "github",
    tool: "Milestone",
    dueDate: milestone.due_on?.slice(0, 10) ?? null,
    progress,
    blocked: false,
    doneCount: milestone.closed_issues,
    blockedCount: 0,
    timeLeft: closed ? "Completed" : "Open",
    membersJson: serializeMembers([]),
  };
}

export function mapGithubIssueToTask(
  issue: GithubIssue,
  owner: string,
  repo: string,
  projectId: string = DEFAULT_PROJECT_ID,
  workspaceId: string = DEFAULT_WORKSPACE_ID,
): NewTask {
  const closed = issue.state === "closed";
  const members = issue.assignees.map((a) => ({
    initials: a.login.slice(0, 2).toUpperCase(),
    avatarUrl: a.avatar_url,
  }));

  return {
    id: `github-${owner}-${repo}-${issue.number}`,
    workspaceId,
    projectId,
    subTeamId: null,
    assigneeId: null,
    parentId: issue.milestone
      ? githubMilestoneTaskId(owner, repo, issue.milestone.number)
      : null,
    title: issue.title,
    description: trimDescription(issue.body),
    status: closed ? "DONE" : "IN_PROGRESS",
    priority: "MEDIUM",
    source: "github",
    tool: issue.labels[0]?.name ?? "GitHub",
    dueDate: null,
    progress: closed ? 100 : 50,
    blocked: false,
    doneCount: closed ? 1 : 0,
    blockedCount: 0,
    timeLeft: closed ? "Completed" : "Open",
    membersJson: serializeMembers(members),
  };
}
