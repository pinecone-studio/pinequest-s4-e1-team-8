import type { OnboardingDraft } from "@/lib/onboarding-draft-storage";
import type { MilestoneDraft } from "@/lib/onboarding/parse-milestone-drafts";

/** Demo team-lead GitHub PAT — set via NEXT_PUBLIC_DEMO_GITHUB_PAT in client/.env.local */
export const DEMO_GITHUB_PAT =
  process.env.NEXT_PUBLIC_DEMO_GITHUB_PAT?.trim() ?? "";

export const DEMO_PROJECT_NAME = "Mazaalai Learn";

export const DEMO_PROJECT_DESCRIPTION =
  "Mazaalai Learn is a Mongolian traditional script learning platform.";

export const DEMO_SCOPING_BRIEF =
  "Scope Mazaalai Learn v1 for a 4-week demo sprint: course catalog and enrollment, learner dashboards with progress tracking, instructor content tools, and a polished launch with seeded demo data and GitHub milestone sync.";

export const DEMO_MILESTONE_DRAFTS: MilestoneDraft[] = [
  {
    id: "milestone-0",
    title: "Platform foundation",
    tasks: [
      "Set up workspace, roles, and demo learner accounts",
      "Define course schema and enrollment data model",
      "Wire onboarding project persistence to the API",
    ],
    isApproved: true,
  },
  {
    id: "milestone-1",
    title: "Learning experience",
    tasks: [
      "Build course catalog and lesson detail views",
      "Add progress tracking on the learner dashboard",
      "Connect instructor tools for publishing modules",
    ],
    isApproved: true,
  },
  {
    id: "milestone-2",
    title: "Demo launch",
    tasks: [
      "Seed Mazaalai Learn mock courses and milestones",
      "Polish responsive UI and theme toggle flows",
      "Sync GitHub milestones and verify dashboard widgets",
    ],
    isApproved: false,
  },
];

export const DEMO_STEP1 = {
  projectName: DEMO_PROJECT_NAME,
  description: DEMO_PROJECT_DESCRIPTION,
  timezone: "(GMT+00:00) UTC",
};

export function applyDemoDefaultsToDraft(draft: OnboardingDraft): OnboardingDraft {
  return {
    ...draft,
    aiGoals: draft.aiGoals.trim() || DEMO_SCOPING_BRIEF,
    step1: {
      ...draft.step1,
      projectName: draft.step1.projectName.trim() || DEMO_STEP1.projectName,
      description: draft.step1.description.trim() || DEMO_STEP1.description,
      timezone: draft.step1.timezone || DEMO_STEP1.timezone,
    },
    step4: {
      milestoneDrafts:
        draft.step4.milestoneDrafts.length > 0
          ? draft.step4.milestoneDrafts
          : DEMO_MILESTONE_DRAFTS,
    },
  };
}

export const DEMO_ONBOARDING_INITIAL = {
  aiGoals: DEMO_SCOPING_BRIEF,
  step1: DEMO_STEP1,
  step4: {
    milestoneDrafts: DEMO_MILESTONE_DRAFTS,
  },
};
