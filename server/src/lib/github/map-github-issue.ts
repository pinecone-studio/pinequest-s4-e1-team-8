import type { NewTask } from "../../schema/task.model";
import type { GithubIssue } from "./github";
import { DEFAULT_PROJECT_ID, DEFAULT_WORKSPACE_ID } from "../tasks/task-defaults";
import { serializeMembers } from "../tasks/task-mapper";

const MAX_DESCRIPTION_LENGTH = 500;

function trimDescription(body: string | null): string | null {
  if (!body) return null;
  return body.length > MAX_DESCRIPTION_LENGTH
    ? `${body.slice(0, MAX_DESCRIPTION_LENGTH)}…`
    : body;
}

export function mapGithubIssueToTask(
  issue: GithubIssue,
  owner: string,
  repo: string,
): NewTask {
  const closed = issue.state === "closed";
  const members = issue.assignees.map((a) => ({
    initials: a.login.slice(0, 2).toUpperCase(),
    avatarUrl: a.avatar_url,
  }));

  return {
    id: `github-${owner}-${repo}-${issue.number}`,
    workspaceId: DEFAULT_WORKSPACE_ID,
    projectId: DEFAULT_PROJECT_ID,
    subTeamId: null,
    assigneeId: null,
    parentId: null,
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
