"use client";

import { useOnboardingStore } from "@/app/onboarding/use-onboarding-store";
import { ScopingCanvas } from "@/components/onboarding/scoping-canvas";
import { ArrowRight } from "lucide-react";

export function StepPlanning() {
  const { step4, advanceFromPlanning, tddConfirmed } = useOnboardingStore();
  const hasMilestones = step4.milestoneDrafts.length > 0;
  const hasApprovedMilestone = step4.milestoneDrafts.some((draft) => draft.isApproved);

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]">
      <div className="text-center">
        <h2 className="text-[19px] font-semibold tracking-[-0.4px] text-foreground">
          Core milestone generation
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          {tddConfirmed
            ? hasMilestones
              ? "Review milestones derived from your TDD and approve at least one to continue."
              : "Generate milestones from your finalized TDD or add them manually."
            : "Complete the TDD canvas first to unlock milestone generation."}
        </p>
      </div>

      <div className="mt-4 min-h-0 overflow-hidden">
        <ScopingCanvas disabled={!tddConfirmed} seedFromTdd />
      </div>

      {hasMilestones && tddConfirmed ? (
        <div className="mt-4 flex shrink-0 items-center border-t border-border pt-4">
          <button
            type="button"
            className="flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!hasApprovedMilestone}
            onClick={advanceFromPlanning}
          >
            Continue
            <ArrowRight size={17} />
          </button>
          <button
            type="button"
            className="ml-auto px-1.5 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-violet-800 dark:hover:text-violet-400"
            onClick={advanceFromPlanning}
          >
            Skip for now
          </button>
        </div>
      ) : null}
    </div>
  );
}
