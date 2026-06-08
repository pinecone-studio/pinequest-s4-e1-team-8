import type { Task } from "../../schema/task.model";

/** Matches client getTaskTeam after mapApiTaskToListItem (team ?? title ?? tool ?? "General"). */
export function taskTeamKey(task: Task): string {
  return task.title?.trim() || task.tool?.trim() || "General";
}
