import { RequireSignIn } from "@/components/auth/require-sign-in";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { Suspense } from "react";

export default function OnboardingStep2Page() {
  return (
    <RequireSignIn>
      <Suspense fallback={null}>
        <OnboardingWizard />
      </Suspense>
    </RequireSignIn>
  );
}
