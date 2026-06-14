"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { NameStep } from "@/components/onboarding/step-name";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export function OnboardingWizard() {
  const router = useRouter();

  const goToDashboard = () => router.replace("/home");

  return (
    <AuthShell cardClassName="max-w-[520px] p-10">
      <div className="flex flex-col gap-8">
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
        >
          <NameStep onContinue={goToDashboard} />
        </motion.div>
      </div>
    </AuthShell>
  );
}
