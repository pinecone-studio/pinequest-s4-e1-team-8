"use client";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <VoiceVerificationForm
      title="Voice sign-in"
      description="Record your voice so Brisk can confirm it's really you before you join meetings."
      onSuccess={() => router.replace("/dashboard")}
      footer={
        <button
          type="button"
          onClick={() => router.replace("/dashboard")}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Skip for now
        </button>
      }
    />
  );
}
