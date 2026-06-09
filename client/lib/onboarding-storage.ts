import type {
  OnboardingData,
  ScopedMilestone,
} from "@/components/onboarding/onboarding-types";
import { resolveScopedMilestones } from "@/lib/onboarding/scoped-milestones";

const STORAGE_KEY = "brisk-onboarding";

function parseScopedMilestones(raw: unknown): ScopedMilestone[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }

  const parsed = raw
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object")
    .map((entry) => ({
      title: typeof entry.title === "string" ? entry.title : "",
      tasks: Array.isArray(entry.tasks)
        ? entry.tasks.filter((task): task is string => typeof task === "string")
        : [],
      isApproved: Boolean(entry.isApproved),
    }))
    .filter((entry) => entry.title.trim());

  return parsed.length > 0 ? parsed : undefined;
}

export function saveOnboardingData(data: OnboardingData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function hydrateOnboardingData(
  data: OnboardingData | null,
): OnboardingData | null {
  if (!data?.projectName?.trim()) {
    return data;
  }

  return {
    ...data,
    scopedMilestones: resolveScopedMilestones(data.scopedMilestones),
  };
}

export function readOnboardingData(): OnboardingData | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OnboardingData>;
    return hydrateOnboardingData({
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
      scopedMilestones: parseScopedMilestones(parsed.scopedMilestones),
    });
  } catch {
    return null;
  }
}

export function hasOnboardingProject(data: OnboardingData | null): data is OnboardingData {
  return !!data?.projectName?.trim();
}
