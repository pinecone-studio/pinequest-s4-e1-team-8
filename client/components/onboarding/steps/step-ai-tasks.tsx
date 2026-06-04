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
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#EEF0FF] text-[#6366F1] grid place-items-center mx-auto mb-3.5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
            <path d="M18 14l.7 1.9L20.6 16.6 18.7 17.3 18 19.2 17.3 17.3 15.4 16.6 17.3 15.9z" />
          </svg>
        </div>
        <h2 className="text-[21px] font-semibold tracking-[-0.4px] text-[#0F172A]">
          Describe your project goals
        </h2>
        <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed">
          We&apos;ll generate your first set of tasks to get the team moving.
        </p>
      </div>

      <textarea
        className="w-full px-3.5 py-3 bg-white border border-[#E8E9EC] rounded-lg text-sm text-[#0F172A] placeholder:text-[#94A3B8] resize-none leading-snug transition-[border-color,box-shadow] focus:outline-none focus:border-[#6366F1] focus:ring-[3px] focus:ring-[#6366F1]/14 disabled:opacity-50 disabled:cursor-not-allowed"
        rows={5}
        value={data.aiGoals}
        disabled={generating}
        onChange={(e) => onChange({ aiGoals: e.target.value })}
        placeholder="e.g. Launch a v1 web app with auth, a dashboard, and Stripe billing within 6 weeks…"
      />
      <p className="text-[12.5px] text-[#94A3B8] mt-2 leading-relaxed">
        Example: &quot;Build an internal analytics portal — data pipeline, charts, and role-based access.&quot;
      </p>

      <div className="flex gap-2.5 mt-6">
        <button
          className="flex-1 h-11 flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#5457e5] disabled:opacity-45 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
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
          className="flex-1 h-11 flex items-center justify-center bg-transparent border border-[#E8E9EC] hover:bg-[#fafbfc] hover:border-[#dcdee2] disabled:opacity-45 disabled:cursor-not-allowed text-[#334155] text-sm font-semibold rounded-lg transition-colors"
          disabled={generating}
          onClick={onFinish}
        >
          Skip — I&apos;ll add tasks manually
        </button>
      </div>
    </>
  );
}
