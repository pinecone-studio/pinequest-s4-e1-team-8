import { RequireSignIn } from "@/components/auth/require-sign-in";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { Suspense } from "react";

export default function OnboardingStep2Page() {
  return (
    <RequireSignIn>
      <Suspense fallback={null}>
        <div className="h-dvh min-h-0 overflow-hidden bg-background">
          <OnboardingWizard />
        </div>
      </Suspense>
    </RequireSignIn>
  );
}
