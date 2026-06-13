"use client";

import { VoiceVerificationForm } from "@/components/auth/voice-verification-form";
import { motion } from "framer-motion";

type VoiceStepProps = {
  onSuccess: () => void;
  onSkip: () => void;
};

export function VoiceStep({ onSuccess, onSkip }: VoiceStepProps) {
  return (
    <div className="relative">
      <motion.div
        className="absolute top-0 left-1/2 size-14 -translate-x-1/2 rounded-full bg-primary/20"
        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <VoiceVerificationForm
        variant="embedded"
        title="Let's map your voice profile"
        description="Speak naturally for a few seconds so Brisk can recognize you before joining meetings."
        onSuccess={onSuccess}
        footer={
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </button>
        }
      />
    </div>
  );
}
