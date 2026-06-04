"use client";

import { ArrowRight } from "lucide-react";
import type { OnboardingData } from "../onboarding-types";

const TIMEZONES = [
  "(GMT-08:00) Pacific Time",
  "(GMT-07:00) Mountain Time",
  "(GMT-06:00) Central Time",
  "(GMT-05:00) Eastern Time",
  "(GMT+00:00) UTC",
  "(GMT+01:00) Central European",
  "(GMT+05:30) India Standard",
  "(GMT+09:00) Japan Standard",
];

interface StepProjectSetupProps {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export function StepProjectSetup({ data, onChange, onNext }: StepProjectSetupProps) {
  const isValid = data.projectName.trim().length > 1;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-[21px] font-semibold tracking-[-0.4px] text-[#0F172A]">
          Set up your project
        </h2>
        <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed">
          Tell us the basics. You can change any of this later in settings.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-[13px] font-medium text-[#334155] mb-1.5">
            Project name
          </label>
          <input
            className="w-full h-11 px-3.5 bg-white border border-[#E8E9EC] rounded-lg text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-[border-color,box-shadow] focus:outline-none focus:border-[#6366F1] focus:ring-[3px] focus:ring-[#6366F1]/14"
            placeholder="e.g. Atlas Platform"
            value={data.projectName}
            onChange={(e) => onChange({ projectName: e.target.value })}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#334155] mb-1.5">
            Description{" "}
            <span className="text-[#94A3B8] font-normal">(optional)</span>
          </label>
          <textarea
            className="w-full px-3.5 py-3 bg-white border border-[#E8E9EC] rounded-lg text-sm text-[#0F172A] placeholder:text-[#94A3B8] resize-none leading-snug transition-[border-color,box-shadow] focus:outline-none focus:border-[#6366F1] focus:ring-[3px] focus:ring-[#6366F1]/14"
            rows={3}
            placeholder="What is this project about?"
            value={data.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#334155] mb-1.5">
            Timezone
          </label>
          <div className="relative">
            <select
              className="w-full h-11 pl-3.5 pr-9 bg-white border border-[#E8E9EC] rounded-lg text-sm text-[#0F172A] appearance-none cursor-pointer transition-[border-color,box-shadow] focus:outline-none focus:border-[#6366F1] focus:ring-[3px] focus:ring-[#6366F1]/14"
              value={data.timezone}
              onChange={(e) => onChange({ timezone: e.target.value })}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz}>{tz}</option>
              ))}
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              width="12"
              height="12"
              viewBox="0 0 12 12"
            >
              <path
                d="M2.5 4.5L6 8l3.5-3.5"
                stroke="#64748B"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-7">
        <button
          className="w-full h-11 flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#5457e5] disabled:opacity-45 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors active:translate-y-px"
          disabled={!isValid}
          onClick={onNext}
        >
          Create Project
          <ArrowRight size={17} />
        </button>
      </div>
    </>
  );
}
