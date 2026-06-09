import type { BoardColumnDefinition } from "@/components/tasks/task-types";

export type GithubBoardColumn = {
  id: string;
  name: string;
};

const GITHUB_COLUMNS_STORAGE_KEY = "github-board-columns";
const GITHUB_SYNC_REPO_KEY = "github-sync-repo";

export function rememberGithubSyncRepo(fullName: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(GITHUB_SYNC_REPO_KEY, fullName);
}

export function readGithubSyncRepo(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(GITHUB_SYNC_REPO_KEY);
}

function githubColumnHeaderClass(name: string): string {
  const lower = name.toLowerCase();

  if (lower.includes("backlog") || lower === "todo") {
    return "border-b border-border/60 bg-muted/30 text-muted-foreground";
  }
  if (lower.includes("progress") || lower === "doing") {
    return "border-b border-border/60 bg-violet-500/15 text-violet-300";
  }
  if (lower.includes("review")) {
    return "border-b border-border/60 bg-amber-500/10 text-amber-200/90";
  }
  if (lower.includes("launch") || lower.includes("done") || lower.includes("complete")) {
    return "border-b border-border/60 bg-emerald-500/10 text-emerald-300/90";
  }

  return "border-b border-border/60 bg-card text-foreground";
}

export function toBoardColumnDefinitions(
  columns: GithubBoardColumn[],
): BoardColumnDefinition[] {
  return columns.map((column) => ({
    id: column.id,
    label: column.name,
    headerClassName: githubColumnHeaderClass(column.name),
  }));
}

export function saveGithubBoardColumns(
  repoKey: string,
  columns: GithubBoardColumn[],
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${GITHUB_COLUMNS_STORAGE_KEY}:${repoKey}`,
    JSON.stringify(columns),
  );
}

export function readGithubBoardColumns(
  repoKey: string,
): GithubBoardColumn[] | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(`${GITHUB_COLUMNS_STORAGE_KEY}:${repoKey}`);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    return parsed.flatMap((entry) => {
      if (
        entry &&
        typeof entry === "object" &&
        "id" in entry &&
        "name" in entry &&
        typeof entry.id === "string" &&
        typeof entry.name === "string"
      ) {
        return [{ id: entry.id, name: entry.name }];
      }
      return [];
    });
  } catch {
    return null;
  }
}

export function repoStorageKey(fullName: string) {
  return fullName.replace(/\//g, "__");
}

export function deriveGithubColumnsFromTasks(
  boardColumns: Array<string | null | undefined>,
): BoardColumnDefinition[] {
  const ordered = new Set<string>();

  for (const column of boardColumns) {
    if (column?.trim()) {
      ordered.add(column.trim());
    }
  }

  return [...ordered].map((name) => ({
    id: name,
    label: name,
    headerClassName: githubColumnHeaderClass(name),
  }));
}
