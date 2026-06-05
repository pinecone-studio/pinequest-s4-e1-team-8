"use client";

import type { OnboardingData } from "../onboarding-types";
import { useBriskAgent } from "@/hooks/useBriskAgent";

function LoadingAnimation() {
  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="relative grid h-14 w-14 place-items-center">
        <span
          className="absolute inset-0 rounded-full border-2 border-violet-500/20"
          style={{ animation: "spin 1.2s linear infinite" }}
        />
        <span
          className="absolute inset-1 rounded-full border-2 border-transparent border-t-violet-400"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-violet-300"
        >
          <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-white">Building your workspace</p>
        <p className="mt-1 text-[13px] text-[#8e8e93]">
          Generating milestones and tasks from your goal…
        </p>
      </div>
    </div>
  );
}

interface StepAiTasksProps {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  onFinish: () => void;
}

export function StepAiTasks({ data, onChange, onFinish }: StepAiTasksProps) {
  const { run, isLoading, error } = useBriskAgent();
  const isValid = data.aiGoals.trim().length > 4;

  const generate = async () => {
    const response = await run({
      projectId: data.projectId,
      workspaceId: data.workspaceId,
      projectName: data.projectName,
      projectDescription: data.description,
      inputMessage: data.aiGoals.trim(),
    });

    if (response.success) {
      onFinish();
    }
  };

  if (isLoading) {
    return <LoadingAnimation />;
  }

  return (
    <>
      <div className="mb-6 text-center">
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
          Describe your project goals
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[#8e8e93]">
          We&apos;ll generate your first set of tasks to get the team moving.
        </p>
      </div>

      <textarea
        className="w-full resize-none rounded-lg border border-white/10 bg-[#121318] px-3.5 py-3 text-sm leading-snug text-white placeholder:text-[#5c5c66] transition-[border-color,box-shadow] focus:border-violet-500 focus:outline-none focus:ring-[3px] focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        rows={5}
        value={data.aiGoals}
        onChange={(e) => onChange({ aiGoals: e.target.value })}
        placeholder="e.g. I need to launch a v1 web app with auth, a dashboard, and Stripe billing within 6 weeks, but I don't know how to break it down for my team…"
      />
      <p className="mt-2 text-[12.5px] leading-relaxed text-[#6b6b73]">
        Example: &quot;Build an internal analytics portal — data pipeline, charts,
        and role-based access.&quot;
      </p>

      {error ? (
        <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-300">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex gap-2.5">
        <button
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-violet-600 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!isValid}
          onClick={() => {
            void generate();
          }}
        >
          ✦ Generate with AI
        </button>
        <button
          className="flex h-11 flex-1 items-center justify-center rounded-lg border border-white/10 bg-transparent text-sm font-semibold text-[#c4c4cc] transition-colors hover:border-white/20 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-45"
          onClick={onFinish}
        >
          Skip — I&apos;ll add tasks manually
        </button>
      </div>
    </>
  );
}
