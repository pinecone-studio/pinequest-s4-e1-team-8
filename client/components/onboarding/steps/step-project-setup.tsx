"use client";

import { useOnboardingStore } from "@/app/onboarding/use-onboarding-store";
import { AsanaPatConnectForm } from "@/components/onboarding/asana-pat-connect-form";
import { GithubPatConnectForm } from "@/components/onboarding/github-pat-connect-form";
import {
  OnboardingStepActions,
  OnboardingStepHeading,
  onboardingInputClassName,
  onboardingPanelClassName,
  onboardingTextareaClassName,
} from "@/components/onboarding/onboarding-layout";
import { useInternalUserId } from "@/hooks/use-internal-user-id";
import {
  fetchAsanaStatus,
  setAsanaUserId,
} from "@/lib/integrations/asana";
import { fetchGithubStatus, setGithubUserId } from "@/lib/integrations/github";
import { Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const DESCRIPTION_MIN_HEIGHT = "5.25rem";

export function StepProjectSetup() {
  const { userId, isLoaded: userReady } = useInternalUserId();
  const {
    step1,
    step3,
    patchStep1,
    canAdvanceFromStep1,
    advanceFromStep1,
    skipFromStep1,
    setGithubConnected,
    setAsanaConnected,
  } = useOnboardingStore();
  const [githubLogin, setGithubLogin] = useState<string | null>(null);
  const [asanaUserName, setAsanaUserName] = useState<string | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const resizeDescription = useCallback(() => {
    const textarea = descriptionRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = DESCRIPTION_MIN_HEIGHT;
    textarea.style.height = `${Math.max(textarea.scrollHeight, textarea.offsetHeight)}px`;
  }, []);

  useEffect(() => {
    resizeDescription();
  }, [resizeDescription, step1.description]);

  useEffect(() => {
    if (!userReady) {
      return;
    }

    setGithubUserId(userId);
    setAsanaUserId(userId);

    void fetchGithubStatus()
      .then((status) => {
        if (status.connected) {
          setGithubConnected(true);
          setGithubLogin(status.githubLogin ?? null);
        }
      })
      .catch(() => {});

    void fetchAsanaStatus()
      .then((status) => {
        if (status.connected) {
          setAsanaConnected(true);
          setAsanaUserName(status.asanaUserName ?? null);
        }
      })
      .catch(() => {});
  }, [setAsanaConnected, setGithubConnected, userId, userReady]);

  return (
    <div>
      <OnboardingStepHeading
        title="Set up your project"
        description="Tell us the basics. You can change any of this later in settings."
      />

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">
            Project name
          </label>
          <input
            className={onboardingInputClassName}
            placeholder="e.g. Atlas Platform"
            value={step1.projectName}
            onChange={(event) => patchStep1({ projectName: event.target.value })}
            autoFocus
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">
            Description <span className="font-normal">(optional)</span>
          </label>
          <textarea
            ref={descriptionRef}
            className={onboardingTextareaClassName}
            rows={1}
            style={{ minHeight: DESCRIPTION_MIN_HEIGHT }}
            placeholder="What is this project about?"
            value={step1.description}
            onChange={(event) => {
              patchStep1({ description: event.target.value });
              requestAnimationFrame(resizeDescription);
            }}
          />
        </div>

        <div className={onboardingPanelClassName}>
          <p className="text-sm font-medium text-foreground">GitHub</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Paste a personal access token to link your repos. Optional — you can
            also connect later in the flow.
          </p>
          <div className="mt-4">
            {step3.githubConnected ? (
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5da283]">
                <Check className="size-4" />
                Connected{githubLogin ? ` as @${githubLogin}` : ""}
              </p>
            ) : (
              <GithubPatConnectForm
                userId={userId}
                disabled={!userReady}
                compact
                onConnected={async (login) => {
                  setGithubLogin(login);
                  setGithubConnected(true);
                }}
              />
            )}
          </div>
        </div>

        <div className={onboardingPanelClassName}>
          <p className="text-sm font-medium text-foreground">Asana</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Paste a personal access token to link your workspaces. Optional —
            you can also connect later in the flow.
          </p>
          <div className="mt-4">
            {step3.asanaConnected ? (
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5da283]">
                <Check className="size-4" />
                Connected{asanaUserName ? ` as ${asanaUserName}` : ""}
              </p>
            ) : (
              <AsanaPatConnectForm
                userId={userId}
                disabled={!userReady}
                compact
                onConnected={async (name) => {
                  setAsanaUserName(name);
                  setAsanaConnected(true);
                }}
              />
            )}
          </div>
        </div>
      </div>

      <OnboardingStepActions
        onContinue={advanceFromStep1}
        onSkip={skipFromStep1}
        continueLabel="Create project"
        continueDisabled={!canAdvanceFromStep1}
      />
    </div>
  );
}
