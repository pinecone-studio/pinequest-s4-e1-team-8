"use client";

import { Check, ArrowRight } from "lucide-react";
import type { OnboardingData } from "../onboarding-types";

function GithubMark() {
  return (
    <div className="w-6 h-6 rounded-full bg-[#0F172A] grid place-items-center text-white font-bold text-[13px]">
      GH
    </div>
  );
}

function AsanaMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="6" r="3.4" fill="#F06A6A" />
      <circle cx="6" cy="15" r="3.4" fill="#F06A6A" />
      <circle cx="16" cy="15" r="3.4" fill="#F06A6A" />
    </svg>
  );
}

interface IntegrationCardProps {
  name: string;
  desc: string;
  logo: React.ReactNode;
  connected: boolean;
  onToggle: () => void;
}

function IntegrationCard({ name, desc, logo, connected, onToggle }: IntegrationCardProps) {
  return (
    <div
      className="flex-1 rounded-xl p-4 flex flex-col gap-3 transition-[border-color,background]"
      style={{
        border: connected ? "1.5px solid #22C55E" : "1px solid #E8E9EC",
        background: connected ? "#ECFDF3" : "#fff",
      }}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-[42px] h-[42px] rounded-[10px] bg-white border border-[#E8E9EC] grid place-items-center flex-none">
          {logo}
        </div>
        <div>
          <div className="text-[15px] font-semibold text-[#0F172A]">{name}</div>
          <div className="text-[12.5px] text-[#64748B]">{desc}</div>
        </div>
      </div>
      <button
        className="w-full h-9 px-3.5 flex items-center justify-center gap-1.5 text-[13px] font-semibold rounded-lg transition-colors"
        style={
          connected
            ? { background: "#fff", border: "1px solid #22C55E", color: "#15803D" }
            : { background: "#0F172A", color: "#fff" }
        }
        onClick={onToggle}
      >
        {connected ? (
          <>
            <Check size={15} />
            Connected
          </>
        ) : (
          "Connect"
        )}
      </button>
    </div>
  );
}

interface StepIntegrationsProps {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function StepIntegrations({ data, onChange, onNext, onSkip }: StepIntegrationsProps) {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-[21px] font-semibold tracking-[-0.4px] text-[#0F172A]">
          Connect your tools
        </h2>
        <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed">
          Link the services your team already uses. Brisk keeps everything in sync.
        </p>
      </div>

      <div className="flex gap-3.5">
        <IntegrationCard
          name="GitHub"
          desc="Sync commits, PRs & issues"
          logo={<GithubMark />}
          connected={data.githubConnected}
          onToggle={() => onChange({ githubConnected: !data.githubConnected })}
        />
        <IntegrationCard
          name="Asana"
          desc="Import tasks & projects"
          logo={<AsanaMark />}
          connected={data.asanaConnected}
          onToggle={() => onChange({ asanaConnected: !data.asanaConnected })}
        />
      </div>

      <div className="flex items-center mt-7">
        <button
          className="min-w-[150px] h-11 px-5 flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#5457e5] text-white text-sm font-semibold rounded-lg transition-colors"
          onClick={onNext}
        >
          Continue
          <ArrowRight size={17} />
        </button>
        <button
          className="ml-auto text-[13.5px] font-medium text-[#64748B] hover:text-[#6366F1] px-1.5 transition-colors"
          onClick={onSkip}
        >
          Skip for now
        </button>
      </div>
    </>
  );
}
