const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-rose-500",
  "bg-indigo-500",
] as const;

export function memberInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const initials = ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  return initials || "?";
}

export function memberAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash];
}

export function parseProjectGoals(goals: string) {
  return goals
    .split(/\n|[.;]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function createProjectId() {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `proj_${suffix}`;
}
