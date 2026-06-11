import type { TddLayoutState } from "@/lib/onboarding/tdd-types";
import type { TeamRole } from "@/components/onboarding/onboarding-types";
import type { MilestoneDraft } from "@/lib/onboarding/parse-milestone-drafts";

const DRAFT_KEY = "brisk-onboarding-draft";

export type OnboardingDraft = {
  step: number;
  projectId: string;
  workspaceId: string;
  aiGoals: string;
  step1: {
    projectName: string;
    description: string;
    timezone: string;
  };
  step2: {
    collaborators: Array<{ email: string; role: TeamRole }>;
  };
  step3: {
    githubConnected: boolean;
    asanaConnected: boolean;
    isGithubDisconnected: boolean;
    isAsanaDisconnected: boolean;
  };
  step4: { milestoneDrafts: MilestoneDraft[] };
  onboardingSessionId?: string;
  tddLayoutState?: TddLayoutState | null;
  tddConfirmed?: boolean;
  inviteToken?: string | null;
};

export function saveOnboardingDraft(draft: OnboardingDraft) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function readOnboardingDraft(): OnboardingDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingDraft;
  } catch {
    return null;
  }
}

export function clearOnboardingDraft() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(DRAFT_KEY);
}
