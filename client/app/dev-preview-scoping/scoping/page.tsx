"use client";

import {
  OnboardingStoreProvider,
  useOnboardingStore,
} from "@/app/onboarding/use-onboarding-store";
import { StepPlanning } from "@/components/onboarding/steps/step-planning";
import { useEffect } from "react";

function PreviewContent() {
  const { patchStep1, setMilestoneDrafts } = useOnboardingStore();

  useEffect(() => {
    patchStep1({
      projectName: "Recipe Sharing App",
      description:
        "A mobile app where home cooks can share recipes, follow each other, and save favorites.",
    });
  }, [patchStep1]);

  return (
    <div className="min-h-screen bg-background p-8">
      <button
        type="button"
        onClick={() =>
          setMilestoneDrafts([
            {
              id: "milestone-0",
              title: "Set up project foundation",
              tasks: ["Initialize repo", "Set up CI", "Configure auth"],
              isApproved: false,
            },
            {
              id: "milestone-1",
              title: "Build recipe feed",
              tasks: ["Design feed UI", "Implement infinite scroll", "Add like/save actions"],
              isApproved: false,
            },
          ])
        }
        className="mb-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
        id="seed-milestones"
      >
        Seed milestones
      </button>
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6">
        <StepPlanning />
      </div>
    </div>
  );
}

export default function ScopingPreviewPage() {
  return (
    <OnboardingStoreProvider>
      <PreviewContent />
    </OnboardingStoreProvider>
  );
}
