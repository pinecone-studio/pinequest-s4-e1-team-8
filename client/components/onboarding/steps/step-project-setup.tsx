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

const inputClassName =
  "w-full rounded-lg border border-white/10 bg-[#121318] text-sm text-white placeholder:text-[#5c5c66] transition-[border-color,box-shadow] focus:border-violet-500 focus:outline-none focus:ring-[3px] focus:ring-violet-500/20";

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
        <h2 className="text-[21px] font-semibold tracking-[-0.4px] text-white">
          Set up your project
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[#8e8e93]">
          Tell us the basics. You can change any of this later in settings.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#c4c4cc]">
            Project name
          </label>
          <input
            className={`${inputClassName} h-11 px-3.5`}
            placeholder="e.g. Atlas Platform"
            value={data.projectName}
            onChange={(e) => onChange({ projectName: e.target.value })}
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#c4c4cc]">
            Description{" "}
            <span className="font-normal text-[#6b6b73]">(optional)</span>
          </label>
          <textarea
            className={`${inputClassName} resize-none px-3.5 py-3 leading-snug`}
            rows={3}
            placeholder="What is this project about?"
            value={data.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#c4c4cc]">
            Timezone
          </label>
          <div className="relative">
            <select
              className={`${inputClassName} h-11 cursor-pointer appearance-none pl-3.5 pr-9`}
              value={data.timezone}
              onChange={(e) => onChange({ timezone: e.target.value })}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} className="bg-[#1a1b1f] text-white">
                  {tz}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
              width="12"
              height="12"
              viewBox="0 0 12 12"
            >
              <path
                d="M2.5 4.5L6 8l3.5-3.5"
                stroke="#8e8e93"
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
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 text-sm font-semibold text-white transition-colors hover:bg-violet-500 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
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
