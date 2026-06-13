"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { NameStep } from "@/components/onboarding/step-name";
import { VoiceStep } from "@/components/onboarding/step-voice";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

type OnboardingStep = 1 | 2;

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>(1);

  const goToDashboard = () => router.replace("/dashboard");

  return (
    <AuthShell cardClassName="max-w-[520px] p-10">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-center gap-2">
          {([1, 2] as const).map((dot) => (
            <span
              key={dot}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                dot === step ? "w-8 bg-primary" : "w-4 bg-muted",
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 ? (
              <NameStep onContinue={() => setStep(2)} />
            ) : (
              <VoiceStep onSuccess={goToDashboard} onSkip={goToDashboard} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AuthShell>
  );
}
