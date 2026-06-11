"use client";

import { cn } from "@/lib/utils";
import type { WizardStep } from "../types";

const STEPS: Array<{ id: WizardStep; label: string }> = [
  { id: "linking", label: "Account linking" },
  { id: "setup", label: "Project setup" },
  { id: "confirm", label: "Confirmation" },
];

type WizardProgressProps = {
  currentStep: WizardStep;
};

export function WizardProgress({ currentStep }: WizardProgressProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep);

  return (
    <div className="mb-8 flex items-center gap-2">
      {STEPS.map((step, index) => {
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;

        return (
          <div key={step.id} className="flex flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-colors",
                  isComplete || isActive ? "bg-violet-600" : "bg-muted",
                )}
              />
              <span
                className={cn(
                  "truncate text-xs font-medium",
                  isActive
                    ? "text-violet-700 dark:text-violet-300"
                    : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
