"use client";

import {
  OnboardingStoreProvider,
  useOnboardingStore,
} from "@/app/onboarding/use-onboarding-store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { initializeProject } from "@/lib/api/projects";
import { clearOnboardingDraft } from "@/lib/onboarding-draft-storage";
import { saveOnboardingData } from "@/lib/onboarding-storage";
import { StepHeader } from "./step-header";
import { StepProjectSetup } from "./steps/step-project-setup";
import { StepInviteTeam } from "./steps/step-invite-team";
import { StepIntegrations } from "./steps/step-integrations";
import { StepAiTasks } from "./steps/step-ai-tasks";

function OnboardingWizardContent() {
  const router = useRouter();
  const { step, toOnboardingData, toInitializePayload } = useOnboardingStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async () => {
    setSaving(true);
    setError(null);

    const localData = toOnboardingData();

    try {
      const payload = toInitializePayload();
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
    } catch {
      saveOnboardingData(localData);
      clearOnboardingDraft();
      setError("Saved locally — sign in and retry to sync with your team.");
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#121212] px-5 py-12">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-violet-600 text-base font-bold text-white">
          B
        </div>
        <span className="text-lg font-semibold tracking-[-0.3px] text-white">
          Brisk
        </span>
      </div>

      <div
        className={`w-full rounded-2xl border border-white/10 bg-[#1a1b1f] p-[28px_30px_30px] shadow-[0_24px_80px_-32px_rgba(0,0,0,0.8)] ${step === 3 ? "max-w-[640px]" : "max-w-[480px]"}`}
      >
        <StepHeader step={step} />

        {step === 0 ? <StepProjectSetup /> : null}
        {step === 1 ? <StepInviteTeam /> : null}
        {step === 2 ? <StepIntegrations /> : null}
        {step === 3 ? (
          <StepAiTasks onFinish={finish} disabled={saving} />
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 text-center text-sm text-amber-400">{error}</p>
      ) : null}

      <button
        className="mt-5 px-1.5 py-1 text-[13px] text-[#6b6b73] transition-colors hover:text-[#a1a1aa] disabled:opacity-50"
        disabled={saving}
        onClick={() => void finish()}
      >
        {saving ? "Saving project…" : "Skip onboarding →"}
      </button>
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
