"use client";

import {
  OnboardingStoreProvider,
  useOnboardingStore,
} from "@/app/onboarding/use-onboarding-store";
import { OnboardingShell } from "@/components/onboarding/onboarding-layout";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { initializeProject } from "@/lib/api/projects";
import {
  exportGithubMilestones,
  extractApiError,
  fetchGithubStatus,
  setGithubUserId,
} from "@/lib/integrations/github";
import { useInternalUserId } from "@/hooks/use-internal-user-id";
import { clearOnboardingDraft } from "@/lib/onboarding-draft-storage";
import { milestoneDraftsToScoped } from "@/lib/onboarding/scoped-milestones";
import { PROJECT_CHANGED_EVENT, saveOnboardingData } from "@/lib/onboarding-storage";
import { StepProjectSetup } from "./steps/step-project-setup";
import { StepTddDiscovery } from "./steps/step-tdd-discovery";
import { StepPlanning } from "./steps/step-planning";
import { StepInviteTeam } from "./steps/step-invite-team";
import { StepIntegrations } from "./steps/step-integrations";

function isDiscoveryCanvas(step: number) {
  return step === 1;
}

function isExpandedStep(step: number) {
  return step === 2;
}

function isWideStep(step: number) {
  return step === 2 || step === 4;
}

function OnboardingWizardContent() {
  const router = useRouter();
  const { userId, isLoaded: userReady } = useInternalUserId();
  const {
    step,
    step3,
    step4,
    inviteToken,
    setInviteToken,
    toOnboardingData,
    toInitializePayload,
    goToPreviousStep,
  } = useOnboardingStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const projectCreationRef = useRef(false);

  // Create the project as soon as step 1 ("Create project") is done so an
  // invite link can be shared before the rest of onboarding is finished.
  useEffect(() => {
    if (step < 1 || inviteToken || projectCreationRef.current) {
      return;
    }
    projectCreationRef.current = true;

    initializeProject(toInitializePayload())
      .then((result) => {
        setInviteToken(result.project.inviteToken);
        saveOnboardingData({
          ...toOnboardingData(),
          projectId: result.project.id,
          workspaceId: result.project.workspaceId,
          projectName: result.project.name,
        });
        window.dispatchEvent(new Event(PROJECT_CHANGED_EVENT));
      })
      .catch(() => {
        projectCreationRef.current = false;
      });
  }, [step, inviteToken, setInviteToken, toInitializePayload, toOnboardingData]);

  const finish = async () => {
    setSaving(true);
    setError(null);

    const payload = toInitializePayload();
    const localData = {
      ...toOnboardingData(),
      scopedMilestones: milestoneDraftsToScoped(step4.milestoneDrafts),
    };

    try {
      if (
        userReady &&
        step3.githubConnected &&
        step4.milestoneDrafts.some((draft) => draft.tasks.some((task) => task.trim()))
      ) {
        setGithubUserId(userId);
        const status = await fetchGithubStatus();
        if (status.repoOwner && status.repoName && status.githubProjectId) {
          await exportGithubMilestones({
            owner: status.repoOwner,
            repo: status.repoName,
            githubProjectId: status.githubProjectId,
            milestones: step4.milestoneDrafts.map((draft) => ({
              title: draft.title,
              tasks: draft.tasks,
            })),
          });
        }
      }

      const result = await initializeProject(payload);
      const members = result.members.map((member) => ({
        email: member.email,
        name: member.email.split("@")[0] ?? member.email,
        role: member.role,
      }));

      saveOnboardingData({
        ...localData,
        projectId: result.project.id,
        workspaceId: result.project.workspaceId,
        projectName: result.project.name,
        members,
      });
      clearOnboardingDraft();
      router.push("/dashboard");
    } catch (finishError) {
      saveOnboardingData(localData);
      clearOnboardingDraft();
      setError(
        extractApiError(
          finishError,
          "Saved locally — sign in and retry to sync with your team.",
        ),
      );
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  if (isDiscoveryCanvas(step)) {
    return (
      <OnboardingShell
        step={step}
        maxWidth="full"
        onBack={goToPreviousStep}
        fillHeight
        contentClassName="min-h-0 py-4 md:py-6"
      >
        <StepTddDiscovery />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      step={step}
      onBack={goToPreviousStep}
      maxWidth={isWideStep(step) ? "xl" : "lg"}
      fillHeight={isExpandedStep(step)}
      contentClassName={isExpandedStep(step) ? "min-h-0 py-4 md:py-6" : undefined}
    >
      {step === 0 ? <StepProjectSetup /> : null}
      {step === 2 ? <StepPlanning /> : null}
      {step === 3 ? <StepInviteTeam /> : null}
      {step === 4 ? <StepIntegrations onFinish={finish} disabled={saving} /> : null}

      {error ? (
        <p className="mt-4 text-center text-sm text-amber-400">{error}</p>
      ) : null}
    </OnboardingShell>
  );
}

export function OnboardingWizard() {
  return (
    <OnboardingStoreProvider>
      <OnboardingWizardContent />
    </OnboardingStoreProvider>
  );
}
