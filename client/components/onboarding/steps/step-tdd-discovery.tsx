"use client";

import { useOnboardingStore } from "@/app/onboarding/use-onboarding-store";
import { OnboardingWorkspace } from "@/components/onboarding/OnboardingWorkspace";

export function StepTddDiscovery() {
  const { advanceFromTddDiscovery, goToPreviousStep, skipTddDiscovery } =
    useOnboardingStore();

  return (
    <OnboardingWorkspace
      onTddConfirmed={advanceFromTddDiscovery}
      onBack={goToPreviousStep}
      onSkip={skipTddDiscovery}
    />
  );
}
