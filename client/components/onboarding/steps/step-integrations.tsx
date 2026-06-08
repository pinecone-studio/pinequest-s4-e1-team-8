"use client";

import { useOnboardingStore } from "@/app/onboarding/use-onboarding-store";
import { fetchAsanaStatus, getAsanaConnectUrl } from "@/lib/integrations/asana";
import { Check, ArrowRight } from "lucide-react";
import { useEffect } from "react";

function GithubMark() {
  return (
    <div className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[13px] font-bold text-white">
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

function IntegrationCard({
  name,
  desc,
  logo,
  connected,
  onToggle,
}: IntegrationCardProps) {
  return (
    <div
      className="flex flex-1 flex-col gap-3 rounded-xl border p-4 transition-[border-color,background]"
      style={{
        borderColor: connected ? "rgba(34,197,94,0.45)" : "rgba(255,255,255,0.1)",
        background: connected ? "rgba(34,197,94,0.08)" : "#121318",
      }}
    >
      <div className="flex items-center gap-2.5">
        <div className="grid h-[42px] w-[42px] flex-none place-items-center rounded-[10px] border border-white/10 bg-[#1a1b1f]">
          {logo}
        </div>
        <div>
          <div className="text-[15px] font-semibold text-white">{name}</div>
          <div className="text-[12.5px] text-[#8e8e93]">{desc}</div>
        </div>
      </div>
      <button
        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold transition-colors"
        style={
          connected
            ? {
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.35)",
                color: "#86efac",
              }
            : { background: "#7c3aed", color: "#fff" }
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

export function StepIntegrations() {
  const {
    step3,
    toggleGithubConnection,
    setAsanaConnected,
    advanceFromStep3,
    skipStep3,
  } = useOnboardingStore();

  useEffect(() => {
    fetchAsanaStatus()
      .then((status) => {
        if (status.connected) {
          setAsanaConnected(true);
        }
      })
      .catch(() => {
        // API unavailable or not connected yet.
      });
  }, [setAsanaConnected]);

  const handleAsanaConnect = () => {
    if (step3.asanaConnected) return;
    window.location.href = getAsanaConnectUrl();
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-[21px] font-semibold tracking-[-0.4px] text-white">
          Connect your tools
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[#8e8e93]">
          Link the services your team already uses. Brisk keeps everything in sync.
        </p>
      </div>

      <div className="flex gap-3.5">
        <IntegrationCard
          name="GitHub"
          desc="Sync commits, PRs & issues"
          logo={<GithubMark />}
          connected={step3.githubConnected}
          onToggle={toggleGithubConnection}
        />
        <IntegrationCard
          name="Asana"
          desc="Import tasks & projects"
          logo={<AsanaMark />}
          connected={step3.asanaConnected}
          onToggle={handleAsanaConnect}
        />
      </div>

      <div className="mt-7 flex items-center">
        <button
          className="flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          onClick={advanceFromStep3}
        >
          Continue
          <ArrowRight size={17} />
        </button>
        <button
          className="ml-auto px-1.5 text-[13.5px] font-medium text-[#8e8e93] transition-colors hover:text-violet-400"
          onClick={skipStep3}
        >
          Skip for now
        </button>
      </div>
    </>
  );
}
