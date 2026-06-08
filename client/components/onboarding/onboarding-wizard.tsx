"use client";

import {
  OnboardingStoreProvider,
  useOnboardingStore,
} from "@/app/onboarding/use-onboarding-store";
import { useRouter } from "next/navigation";
import { saveOnboardingData } from "@/lib/onboarding-storage";
import { StepHeader } from "./step-header";
import { StepProjectSetup } from "./steps/step-project-setup";
import { StepInviteTeam } from "./steps/step-invite-team";
import { StepIntegrations } from "./steps/step-integrations";
import { StepAiTasks } from "./steps/step-ai-tasks";

function OnboardingWizardContent() {
  const router = useRouter();
  const { step, toOnboardingData } = useOnboardingStore();

  const finish = () => {
    saveOnboardingData(toOnboardingData());
    router.push("/dashboard");
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

      <div className="w-full max-w-[480px] rounded-2xl border border-white/10 bg-[#1a1b1f] p-[28px_30px_30px] shadow-[0_24px_80px_-32px_rgba(0,0,0,0.8)]">
        <StepHeader step={step} />

        {step === 0 ? <StepProjectSetup /> : null}
        {step === 1 ? <StepInviteTeam /> : null}
        {step === 2 ? <StepIntegrations /> : null}
        {step === 3 ? <StepAiTasks onFinish={finish} /> : null}
      </div>

      <button
        className="mt-5 px-1.5 py-1 text-[13px] text-[#6b6b73] transition-colors hover:text-[#a1a1aa]"
        onClick={finish}
      >
        Skip onboarding →
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
