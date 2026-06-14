"use client";

import { VoiceOnboardingFlow } from "@/components/onboarding/voice-onboarding-flow";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  return <VoiceOnboardingFlow onComplete={() => router.replace("/home")} />;
}
