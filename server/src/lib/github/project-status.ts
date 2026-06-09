import type { TaskStatus } from "../../schema/task.model";
import type { GithubProjectField, GithubProjectItem } from "./projects";

export const STATUS_FIELD_NAME = "Status";
export const NO_STATUS_COLUMN = "No Status";

export type GithubBoardColumn = {
  id: string;
  name: string;
};

export type GithubIssueProjectStatus = {
  statusName: string;
  optionId: string;
};

export function findStatusField(
  fields: GithubProjectField[],
): GithubProjectField | undefined {
  const singleSelects = fields.filter((f) => f.dataType === "SINGLE_SELECT");
  const named = singleSelects.find(
    (f) => f.name.toLowerCase() === STATUS_FIELD_NAME.toLowerCase(),
  );
  return named ?? singleSelects[0];
}

export function getItemStatusValue(
  item: GithubProjectItem,
  statusFieldId: string,
): GithubIssueProjectStatus | null {
  const value = item.fieldValues.find((v) => v.fieldId === statusFieldId);
  if (!value?.optionId || typeof value.value !== "string") {
    return null;
  }

  return { statusName: value.value, optionId: value.optionId };
}

export function buildBoardColumns(
  statusField: GithubProjectField | undefined,
): GithubBoardColumn[] {
  if (!statusField?.options?.length) {
    return [];
  }

  return statusField.options.map((option) => ({
    id: option.name,
    name: option.name,
  }));
}

export function buildIssueStatusMap(
  items: GithubProjectItem[],
  statusField: GithubProjectField | undefined,
): Map<number, GithubIssueProjectStatus> {
  const map = new Map<number, GithubIssueProjectStatus>();
  if (!statusField) return map;

  for (const item of items) {
    if (item.type !== "ISSUE" || item.content?.type !== "Issue") continue;

    const status = getItemStatusValue(item, statusField.id);
    if (!status) continue;

    map.set(item.content.number, status);
  }

  return map;
}

export function githubStatusNameToDbStatus(
  statusName: string | null | undefined,
  issueClosed: boolean,
): TaskStatus {
  const lower = (statusName ?? "").trim().toLowerCase();

  if (lower.includes("backlog") || lower === "todo") {
    return "BACKLOG";
  }
  if (lower.includes("progress") || lower === "doing") {
    return "IN_PROGRESS";
  }
  if (
    lower.includes("launch") ||
    lower.includes("done") ||
    lower.includes("complete")
  ) {
    return "DONE";
  }
  if (lower.includes("review")) {
    return "TODO";
  }

  return issueClosed ? "DONE" : "IN_PROGRESS";
}
