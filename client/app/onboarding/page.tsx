import { RequireDemoLogin } from "@/components/auth/require-demo-login";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { Suspense } from "react";

export default function OnboardingPage() {
  return (
    <RequireDemoLogin>
      <Suspense fallback={null}>
        <OnboardingWizard />
      </Suspense>
    </RequireDemoLogin>
  );
}
