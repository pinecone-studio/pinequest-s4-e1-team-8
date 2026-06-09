import type { OnboardingData } from "@/components/onboarding/onboarding-types";

const STORAGE_KEY = "brisk-onboarding";

export function saveOnboardingData(data: OnboardingData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function readOnboardingData(): OnboardingData | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OnboardingData>;
    return {
      projectId: parsed.projectId ?? "",
      workspaceId: parsed.workspaceId ?? "",
      projectName: parsed.projectName ?? "",
      description: parsed.description ?? "",
      timezone: parsed.timezone ?? "(GMT+00:00) UTC",
      members: parsed.members ?? [],
      githubConnected: parsed.githubConnected ?? false,
      asanaConnected: parsed.asanaConnected ?? false,
      isGithubDisconnected: parsed.isGithubDisconnected ?? false,
      isAsanaDisconnected: parsed.isAsanaDisconnected ?? false,
      aiGoals: parsed.aiGoals ?? "",
      scopedMilestones: Array.isArray(parsed.scopedMilestones)
        ? parsed.scopedMilestones
            .filter(
              (entry): entry is NonNullable<typeof entry> =>
                !!entry && typeof entry === "object",
            )
            .map((entry) => ({
              title: typeof entry.title === "string" ? entry.title : "",
              tasks: Array.isArray(entry.tasks)
                ? entry.tasks.filter((task): task is string => typeof task === "string")
                : [],
              isApproved: Boolean(entry.isApproved),
            }))
            .filter((entry) => entry.title.trim())
        : undefined,
    };
  } catch {
    return null;
  }
}

export function hasOnboardingProject(data: OnboardingData | null): data is OnboardingData {
  return !!data?.projectName?.trim();
}
