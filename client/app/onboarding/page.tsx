import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { Suspense } from "react";

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingWizard />
    </Suspense>
  );
}
