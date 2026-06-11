"use client";

import { useOnboardingStore } from "@/app/onboarding/use-onboarding-store";
import { OnboardingAsanaConnect } from "@/components/onboarding/onboarding-asana-connect";
import { OnboardingGithubConnect } from "@/components/onboarding/onboarding-github-connect";
import {
  OnboardingStepActions,
  OnboardingStepHeading,
} from "@/components/onboarding/onboarding-layout";
import { useInternalUserId } from "@/hooks/use-internal-user-id";
import { fetchAsanaStatus, setAsanaUserId } from "@/lib/integrations/asana";
import { useEffect } from "react";

interface StepIntegrationsProps {
  onFinish: () => void | Promise<void>;
  disabled?: boolean;
}

export function StepIntegrations({
  onFinish,
  disabled = false,
}: StepIntegrationsProps) {
  const { userId, isLoaded: userReady } = useInternalUserId();
  const { setAsanaConnected, skipStep3 } = useOnboardingStore();

  useEffect(() => {
    if (!userReady) return;
    setAsanaUserId(userId);
    fetchAsanaStatus()
      .then((status) => {
        if (status.connected) {
          setAsanaConnected(true);
        }
      })
      .catch(() => {});
  }, [setAsanaConnected, userReady, userId]);

  return (
    <div>
      <OnboardingStepHeading
        title="Connect your tools"
        description="Optional — link GitHub and Asana with personal access tokens, or skip and set them up later."
      />

      <div className="space-y-4">
        <OnboardingGithubConnect />
        <OnboardingAsanaConnect />
      </div>

      <OnboardingStepActions
        onContinue={() => void onFinish()}
        onSkip={() => {
          skipStep3();
          void onFinish();
        }}
        continueLabel={disabled ? "Saving…" : "Continue to dashboard"}
        skipLabel="Skip integrations"
        continueDisabled={disabled}
        loading={disabled}
      />
    </div>
  );
}
