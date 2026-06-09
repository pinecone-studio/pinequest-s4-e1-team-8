"use client";

import { ScopingCanvas } from "@/components/onboarding/scoping-canvas";
import { useOnboardingStore } from "@/app/onboarding/use-onboarding-store";

interface StepAiTasksProps {
  onFinish: () => void | Promise<void>;
  disabled?: boolean;
}

export function StepAiTasks({ onFinish, disabled = false }: StepAiTasksProps) {
  const { step4 } = useOnboardingStore();
  const hasDrafts = step4.milestoneDrafts.length > 0;

  return (
    <>
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3.5 grid h-12 w-12 place-items-center rounded-xl bg-violet-500/15 text-violet-400">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
            <path d="M18 14l.7 1.9L20.6 16.6 18.7 17.3 18 19.2 17.3 17.3 15.4 16.6 17.3 15.9z" />
          </svg>
        </div>
        <h2 className="text-[21px] font-semibold tracking-[-0.4px] text-white">
          Scope your project
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[#8e8e93]">
          Chat with the onboarding worker to draft milestones before launch.
        </p>
      </div>

      <ScopingCanvas />

      <div className="mt-6 flex gap-2.5">
        <button
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-violet-600 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!hasDrafts || disabled}
          onClick={() => void onFinish()}
        >
          {disabled ? "Saving…" : "Continue to dashboard"}
        </button>
        <button
          className="flex h-11 flex-1 items-center justify-center rounded-lg border border-white/10 bg-transparent text-sm font-semibold text-[#c4c4cc] transition-colors hover:border-white/20 hover:bg-white/[0.04] disabled:opacity-50"
          disabled={disabled}
          onClick={() => void onFinish()}
        >
          Skip — I&apos;ll add tasks manually
        </button>
      </div>
    </>
  );
}
