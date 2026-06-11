"use client";

import {
  OnboardingStoreProvider,
  useOnboardingStore,
} from "@/app/onboarding/use-onboarding-store";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { saveOnboardingData } from "@/lib/onboarding-storage";
import { AuthThemeToggle } from "@/components/auth/auth-theme-toggle";
import { cn } from "@/lib/utils";
import { StepHeader } from "./step-header";
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

function OnboardingWizardContent() {
  const router = useRouter();
  const { userId, isLoaded: userReady } = useInternalUserId();
  const { step, step3, step4, toOnboardingData, toInitializePayload, goToPreviousStep } =
    useOnboardingStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div className="relative flex h-dvh min-h-0 flex-col bg-background">
        <div className="absolute top-6 right-6 z-20 w-[168px]">
          <AuthThemeToggle />
        </div>
        <StepTddDiscovery />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full px-5",
        isExpandedStep(step)
          ? "grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 py-6"
          : "flex min-h-full flex-col items-center py-8 md:py-12",
      )}
    >
      <div className="absolute top-6 right-6 w-[168px]">
        <AuthThemeToggle />
      </div>

      <div
        className={cn(
          "flex items-center gap-2.5",
          isExpandedStep(step) ? "justify-center" : "mb-6",
        )}
      >
        <div className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-violet-600 text-base font-bold text-white">
          B
        </div>
        <span className="text-lg font-semibold tracking-[-0.3px] text-foreground">
          Brisk
        </span>
      </div>

      <div
        className={cn(
          isExpandedStep(step) ? "min-h-0 w-full justify-self-center" : "w-full",
          isExpandedStep(step)
            ? "grid h-full max-w-[760px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl border border-border bg-card p-[28px_30px_24px] shadow-lg dark:shadow-[0_24px_80px_-32px_rgba(0,0,0,0.8)]"
            : "mx-auto w-full max-w-[480px] rounded-2xl border border-border bg-card p-[28px_30px_30px] shadow-lg dark:shadow-[0_24px_80px_-32px_rgba(0,0,0,0.8)]",
        )}
      >
        <StepHeader step={step} onBack={goToPreviousStep} />

        <div className={cn(isExpandedStep(step) && "h-full min-h-0 overflow-hidden")}>
          {step === 0 ? <StepProjectSetup /> : null}
          {step === 2 ? <StepPlanning /> : null}
          {step === 3 ? <StepInviteTeam /> : null}
          {step === 4 ? (
            <StepIntegrations onFinish={finish} disabled={saving} />
          ) : null}
        </div>
      </div>

      {!isExpandedStep(step) && error ? (
        <p className="mt-3 text-center text-sm text-amber-700 dark:text-amber-400">{error}</p>
      ) : null}

      {!isExpandedStep(step) ? (
        <button
          className="mt-5 px-1.5 py-1 text-[13px] text-foreground/80 transition-colors hover:text-muted-foreground disabled:opacity-50"
          disabled={saving}
          onClick={() => void finish()}
        >
          {saving ? "Saving project…" : "Skip onboarding →"}
        </button>
      ) : null}
    </div>
  );
}

export function OnboardingWizard() {
  return (
    <OnboardingStoreProvider>
      <OnboardingWizardContent />
    </OnboardingStoreProvider>
  );
}
