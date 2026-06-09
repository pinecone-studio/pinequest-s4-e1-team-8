import type { AsanaTask } from "../../services/asana";
import type { NewTask } from "../../schema/task.model";
import { DEFAULT_PROJECT_ID, DEFAULT_WORKSPACE_ID } from "../tasks/task-defaults";
import { serializeMembers } from "../tasks/task-mapper";

const MAX_DESCRIPTION_LENGTH = 500;

function trimDescription(notes: string | undefined): string | null {
  if (!notes?.trim()) return null;
  return notes.length > MAX_DESCRIPTION_LENGTH
    ? `${notes.slice(0, MAX_DESCRIPTION_LENGTH)}…`
    : notes;
}

function formatTimeLeft(dueOn: string | null | undefined, completed: boolean) {
  if (completed) return "Completed";
  if (!dueOn) return "No due date";

  const due = new Date(dueOn);
  if (Number.isNaN(due.getTime())) return "No due date";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "1 day left";
  return `${diffDays} days left`;
}

export function mapAsanaTaskToTask(
  task: AsanaTask,
  projectGid: string,
  projectName: string,
): NewTask {
  const members = task.assignee
    ? [
        {
          initials: task.assignee.name.slice(0, 2).toUpperCase(),
        },
      ]
    : [];

  return {
    id: `asana-${task.gid}`,
    workspaceId: DEFAULT_WORKSPACE_ID,
    projectId: DEFAULT_PROJECT_ID,
    subTeamId: null,
    assigneeId: null,
    parentId: null,
    title: task.name,
    description: trimDescription(task.notes),
    status: task.completed ? "DONE" : "TODO",
    priority: "MEDIUM",
    source: "asana",
    tool: projectName || "Asana",
    dueDate: task.due_on ?? null,
    progress: task.completed ? 100 : 40,
    blocked: false,
    doneCount: task.completed ? 1 : 0,
    blockedCount: 0,
    timeLeft: formatTimeLeft(task.due_on, task.completed),
    membersJson: serializeMembers(members),
  };
}
