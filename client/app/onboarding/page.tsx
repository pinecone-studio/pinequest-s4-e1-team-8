"use client";

import { VoiceVerificationForm } from "@/components/auth/voice-verification-form";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  // Always show the voice step after sign-in. The form auto-selects "enroll"
  // for first-time users and "verify" for returning users.
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
