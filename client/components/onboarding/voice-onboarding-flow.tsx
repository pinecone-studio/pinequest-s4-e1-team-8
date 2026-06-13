"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { useClientApiAuth } from "@/lib/api/auth-interceptor";
import {
  formatOnboardingApiError,
  getVoiceOnboardingStatus,
  submitVoiceOnboardingRecording,
} from "@/lib/api/onboarding";
import { useVoiceRecorder } from "@/lib/audio/use-voice-recorder";
import { pickRandomVoicePrompt } from "@/lib/onboarding/voice-prompts";
import { useEffect, useState } from "react";
import { VoiceCaptureStep } from "./voice-capture-step";
import { VoicePermissionStep } from "./voice-permission-step";

type OnboardingStep = "loading" | "permission" | "capture";

type VoiceOnboardingFlowProps = {
  onComplete: () => void;
};

export function VoiceOnboardingFlow({ onComplete }: VoiceOnboardingFlowProps) {
  useClientApiAuth();

  const [step, setStep] = useState<OnboardingStep>("loading");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [promptText, setPromptText] = useState(() => pickRandomVoicePrompt());
  const recorder = useVoiceRecorder();

  useEffect(() => {
    let cancelled = false;

    getVoiceOnboardingStatus()
      .then((status) => {
        if (cancelled) {
          return;
        }

        if (status.hasVoiceData) {
          onComplete();
          return;
        }

        setStep("permission");
      })
      .catch(() => {
        if (!cancelled) {
          setStep("permission");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onComplete]);

  const handleRequestAccess = async () => {
    const granted = await recorder.requestMicrophoneAccess();
    if (granted) {
      setStep("capture");
    }
  };

  const handleReRecord = async () => {
    recorder.releaseStream();
    recorder.resetRecording();
    setPromptText((previousPrompt) => pickRandomVoicePrompt(previousPrompt));
    await recorder.requestMicrophoneAccess();
  };

  const handleSave = async () => {
    if (!recorder.audioBlob) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitVoiceOnboardingRecording(recorder.audioBlob);
      recorder.releaseStream();
      onComplete();
    } catch (error) {
      setSubmitError(formatOnboardingApiError(error));
      setIsSubmitting(false);
    }
  };

  if (step === "loading") {
    return (
      <AuthShell cardClassName="max-w-[520px] p-10">
        <div className="flex min-h-[280px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell cardClassName="max-w-[520px] p-10">
      {step === "permission" ? (
        <VoicePermissionStep
          isRequesting={recorder.permissionState === "requesting"}
          errorMessage={recorder.errorMessage}
          onRequestAccess={handleRequestAccess}
        />
      ) : (
        <VoiceCaptureStep
          promptText={promptText}
          isRecording={recorder.isRecording}
          isMonitoring={recorder.isMonitoring}
          hasRecording={Boolean(recorder.audioBlob)}
          elapsedMs={recorder.elapsedMs}
          waveformDataRef={recorder.waveformDataRef}
          isSubmitting={isSubmitting}
          errorMessage={submitError ?? recorder.errorMessage}
          onStartRecording={recorder.startRecording}
          onStopRecording={recorder.stopRecording}
          onReRecord={() => void handleReRecord()}
          onSave={() => void handleSave()}
        />
      )}
    </AuthShell>
  );
}
