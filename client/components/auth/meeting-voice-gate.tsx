"use client";

import { VoiceVerificationForm } from "@/components/auth/voice-verification-form";
import { useClientApiAuth } from "@/lib/api/auth-interceptor";
import { useAuth } from "@clerk/nextjs";
import { useState, type ReactNode } from "react";

type MeetingVoiceGateProps = {
  children: ReactNode;
};

export function MeetingVoiceGate({ children }: MeetingVoiceGateProps) {
  useClientApiAuth();

  const { isLoaded, isSignedIn } = useAuth();
  // Always verify when entering a room. Don't trust the sign-in enrollment
  // flag — joining a meeting is a separate identity check each time.
  const [verified, setVerified] = useState(false);

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn || verified) {
    return <>{children}</>;
  }

  return (
    <VoiceVerificationForm
      title="Verify your voice to join"
      description="Before entering the meeting, speak naturally for a few seconds so Brisk can confirm it is you."
      onSuccess={() => setVerified(true)}
    />
  );
}
