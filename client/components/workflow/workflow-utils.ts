import type { GithubPullItem } from "@/lib/integrations/github";

export function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function prStatusBadge(state: string) {
  if (state === "open") return { label: "Open", className: "bg-emerald-500/10 text-emerald-600" };
  if (state === "merged") return { label: "Merged", className: "bg-violet-500/10 text-violet-600" };
  return { label: "Closed", className: "bg-muted text-muted-foreground" };
}

export function mergeableLabel(pull: GithubPullItem) {
  if (pull.mergeable === false) return { text: "Conflicts must be resolved", tone: "error" as const };
  const state = pull.mergeable_state ?? "unknown";
  if (state === "blocked") return { text: "Blocked by required reviews or checks", tone: "warn" as const };
  if (state === "dirty") return { text: "Merge conflicts", tone: "error" as const };
  if (state === "unstable") return { text: "Failing checks", tone: "warn" as const };
  if (state === "clean") return { text: "Ready to merge", tone: "ok" as const };
  return { text: "Merge status unknown", tone: "muted" as const };
}

export function canMerge(pull: GithubPullItem) {
  return (
    pull.state === "open" &&
    !pull.draft &&
    pull.mergeable !== false &&
    (pull.mergeable_state === "clean" || pull.mergeable_state === "unstable")
  );
}
