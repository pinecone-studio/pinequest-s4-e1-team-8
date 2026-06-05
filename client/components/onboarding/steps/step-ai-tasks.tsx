"use client";

import { useState } from "react";
import type { OnboardingData } from "../onboarding-types";

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      style={{ animation: "spin 0.7s linear infinite" }}
    >
      <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.35)" strokeWidth="2.4" fill="none" />
      <path d="M8 2a6 6 0 016 6" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

interface StepAiTasksProps {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  onFinish: () => void;
}

export function StepAiTasks({ data, onChange, onFinish }: StepAiTasksProps) {
  const [generating, setGenerating] = useState(false);
  const isValid = data.aiGoals.trim().length > 4;

  const generate = () => {
    setGenerating(true);
    setTimeout(onFinish, 1300);
  };

  return (
    <>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3.5 grid h-12 w-12 place-items-center rounded-xl bg-violet-500/15 text-violet-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
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
        disabled={generating}
        onChange={(e) => onChange({ aiGoals: e.target.value })}
        placeholder="e.g. Launch a v1 web app with auth, a dashboard, and Stripe billing within 6 weeks…"
      />
      <p className="mt-2 text-[12.5px] leading-relaxed text-[#6b6b73]">
        Example: &quot;Build an internal analytics portal — data pipeline, charts, and role-based access.&quot;
      </p>

      <div className="mt-6 flex gap-2.5">
        <button
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-violet-600 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!isValid || generating}
          onClick={generate}
        >
          {generating ? (
            <>
              <Spinner />
              Generating…
            </>
          ) : (
            <>✦ Generate with AI</>
          )}
        </button>
        <button
          className="flex h-11 flex-1 items-center justify-center rounded-lg border border-white/10 bg-transparent text-sm font-semibold text-[#c4c4cc] transition-colors hover:border-white/20 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={generating}
          onClick={onFinish}
        >
          Skip — I&apos;ll add tasks manually
        </button>
      </div>
    </>
  );
}
