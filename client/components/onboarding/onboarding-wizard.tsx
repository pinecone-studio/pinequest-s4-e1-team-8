"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepHeader } from "./step-header";
import { StepProjectSetup } from "./steps/step-project-setup";
import { StepInviteTeam } from "./steps/step-invite-team";
import { StepIntegrations } from "./steps/step-integrations";
import { StepAiTasks } from "./steps/step-ai-tasks";
import type { OnboardingData } from "./onboarding-types";

const INITIAL_DATA: OnboardingData = {
  projectName: "",
  description: "",
  timezone: "(GMT+00:00) UTC",
  members: [],
  githubConnected: false,
  asanaConnected: false,
  aiGoals: "",
};

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);

  const patch = (partial: Partial<OnboardingData>) =>
    setData((d) => ({ ...d, ...partial }));

  const next = () => setStep((s) => Math.min(3, s + 1));

  const finish = () => {
    router.push("/dashboard");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-12"
      style={{ background: "#F4F5F7" }}
    >
      {/* Brisk logo */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-[30px] h-[30px] rounded-[9px] bg-[#0F172A] grid place-items-center text-white font-bold text-base">
          B
        </div>
        <span className="text-lg font-semibold tracking-[-0.3px] text-[#0F172A]">Brisk</span>
      </div>

      {/* Wizard card */}
      <div
        className="w-full max-w-[480px] bg-white border border-[#E8E9EC] rounded-2xl"
        style={{ padding: "28px 30px 30px" }}
      >
        <StepHeader step={step} />

        {step === 0 && (
          <StepProjectSetup data={data} onChange={patch} onNext={next} />
        )}
        {step === 1 && (
          <StepInviteTeam data={data} onChange={patch} onNext={next} onSkip={next} />
        )}
        {step === 2 && (
          <StepIntegrations data={data} onChange={patch} onNext={next} onSkip={next} />
        )}
        {step === 3 && (
          <StepAiTasks data={data} onChange={patch} onFinish={finish} />
        )}
      </div>

      {/* Skip all */}
      <button
        className="mt-5 text-[13px] text-[#94A3B8] hover:text-[#64748B] px-1.5 py-1 transition-colors"
        onClick={finish}
      >
        Skip onboarding →
      </button>
    </div>
  );
}
