"use client";

import { VoiceVerificationForm } from "@/components/auth/voice-verification-form";
import { useClientApiAuth } from "@/lib/api/auth-interceptor";
import { isVoiceVerifiedThisSession } from "@/lib/voice/session";
import { useAuth } from "@clerk/nextjs";
import { useState, type ReactNode } from "react";

type MeetingVoiceGateProps = {
  children: ReactNode;
};

export function MeetingVoiceGate({ children }: MeetingVoiceGateProps) {
  useClientApiAuth();

  const { isLoaded, isSignedIn } = useAuth();
  const [verified, setVerified] = useState(() => isVoiceVerifiedThisSession());

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn || verified || isVoiceVerifiedThisSession()) {
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
