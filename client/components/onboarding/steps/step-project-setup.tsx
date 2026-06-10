"use client";

import { useOnboardingStore } from "@/app/onboarding/use-onboarding-store";
import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

const inputClassName =
  "w-full rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] focus:border-violet-500 focus:outline-none focus:ring-[3px] focus:ring-violet-500/20";

const DESCRIPTION_MIN_HEIGHT = "5.25rem";

export function StepProjectSetup() {
  const { step1, patchStep1, canAdvanceFromStep1, advanceFromStep1 } =
    useOnboardingStore();
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

  return (
    <>
      <div className="mb-6">
        <h2 className="text-[21px] font-semibold tracking-[-0.4px] text-foreground">
          Set up your project
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground">
          Tell us the basics. You can change any of this later in settings.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-foreground">
            Project name
          </label>
          <input
            className={`${inputClassName} h-11 px-3.5`}
            placeholder="e.g. Atlas Platform"
            value={step1.projectName}
            onChange={(event) =>
              patchStep1({ projectName: event.target.value })
            }
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-foreground">
            Description{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            ref={descriptionRef}
            className={`${inputClassName} resize-none overflow-hidden px-3.5 py-3 leading-snug`}
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

      <div className="mt-7">
        <button
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 text-sm font-semibold text-white transition-colors hover:bg-violet-500 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!canAdvanceFromStep1}
          onClick={advanceFromStep1}
        >
          Create Project
          <ArrowRight size={17} />
        </button>
      </div>
    </>
  );
}
