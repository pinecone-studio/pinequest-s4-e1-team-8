"use client";

import { useOnboardingStore } from "@/app/onboarding/use-onboarding-store";
import { OnboardingStepActions } from "@/components/onboarding/onboarding-layout";
import { ScopingCanvas } from "@/components/onboarding/scoping-canvas";

export function StepPlanning() {
  const { step4, advanceFromPlanning } = useOnboardingStore();
  const hasMilestones = step4.milestoneDrafts.length > 0;
  const hasApprovedMilestone = step4.milestoneDrafts.some(
    (draft) => draft.isApproved,
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-hidden">
        <ScopingCanvas seedFromTdd />
      </div>

      <OnboardingStepActions
        onContinue={advanceFromPlanning}
        onSkip={advanceFromPlanning}
        continueDisabled={hasMilestones && !hasApprovedMilestone}
        className="mt-6"
      />
    </div>
  );
}
