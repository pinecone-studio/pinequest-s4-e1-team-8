"use client";

import { useOnboardingStore } from "@/app/onboarding/use-onboarding-store";
import {
  OnboardingStepActions,
  OnboardingStepHeading,
  onboardingInputClassName,
  onboardingTextareaClassName,
} from "@/components/onboarding/onboarding-layout";
import { useCallback, useEffect, useRef } from "react";

const DESCRIPTION_MIN_HEIGHT = "5.25rem";

export function StepProjectSetup() {
  const {
    step1,
    patchStep1,
    canAdvanceFromStep1,
    advanceFromStep1,
    skipFromStep1,
  } = useOnboardingStore();
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

  const projectNameTouched = step1.projectName.length > 0;
  const showProjectNameError = projectNameTouched && !canAdvanceFromStep1;

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
            aria-invalid={showProjectNameError}
            autoFocus
          />
          {showProjectNameError ? (
            <p className="mt-2 text-xs text-destructive">
              Project name can&apos;t be just whitespace.
            </p>
          ) : null}
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
