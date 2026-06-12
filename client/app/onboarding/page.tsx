"use client";

import { VoiceVerificationForm } from "@/components/auth/voice-verification-form";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <VoiceVerificationForm
      title="Set up voice sign-in"
      description="Record a short voice sample so Brisk can recognize you before joining meetings."
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
