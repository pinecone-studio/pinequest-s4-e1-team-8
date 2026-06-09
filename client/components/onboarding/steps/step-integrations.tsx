"use client";

import { useOnboardingStore } from "@/app/onboarding/use-onboarding-store";
import { useInternalUserId } from "@/hooks/use-internal-user-id";
import {
  fetchAsanaStatus,
  getAsanaConnectUrl,
  setAsanaUserId,
} from "@/lib/integrations/asana";
import { cn } from "@/lib/utils";
import { Check, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function GithubMark() {
  return (
    <div className="grid h-6 w-6 place-items-center rounded-full bg-muted/50 text-[13px] font-bold text-foreground">
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
  disabled?: boolean;
}

function IntegrationCard({
  name,
  desc,
  logo,
  connected,
  onToggle,
  disabled = false,
}: IntegrationCardProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-3 rounded-xl border p-4 transition-[border-color,background]",
        connected
          ? "border-emerald-500/40 bg-emerald-50 dark:border-emerald-500/45 dark:bg-emerald-500/10"
          : "border-border bg-muted/40 dark:bg-secondary",
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="grid h-[42px] w-[42px] flex-none place-items-center rounded-[10px] border border-border bg-card">
          {logo}
        </div>
        <div>
          <div className="text-[15px] font-semibold text-foreground">{name}</div>
          <div className="text-[12.5px] text-foreground">{desc}</div>
        </div>
      </div>
      <button
        className={cn(
          "flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          connected
            ? "border-emerald-500/35 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
            : "border-transparent bg-violet-600 text-white hover:bg-violet-500",
        )}
        disabled={disabled || connected}
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

const ASANA_ERROR_MESSAGES: Record<string, string> = {
  not_configured:
    "Asana is not set up yet (missing ASANA_CLIENT_ID in .env.local). Use Skip for now.",
  missing_client_credentials:
    "Asana credentials are incomplete. Use Skip for now or ask your teammate to add them.",
  missing_user: "Could not start Asana sign-in. Refresh and try again.",
};

function asanaErrorMessage(code: string | null) {
  if (!code) return null;
  return ASANA_ERROR_MESSAGES[code] ?? `Asana connection failed (${code}). You can skip this step.`;
}

export function StepIntegrations() {
  const { userId, isLoaded: userReady } = useInternalUserId();
  const searchParams = useSearchParams();
  const {
    step3,
    toggleGithubConnection,
    setAsanaConnected,
    advanceFromStep3,
    skipStep3,
    setStep,
  } = useOnboardingStore();
  const [asanaMessage, setAsanaMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userReady) return;
    setAsanaUserId(userId);
    fetchAsanaStatus()
      .then((status) => {
        if (status.connected) {
          setAsanaConnected(true);
        }
      })
      .catch(() => {
        // API unavailable or not connected yet.
      });
  }, [setAsanaConnected, userReady, userId]);

  useEffect(() => {
    const connected = searchParams.get("asana_connected");
    const error = searchParams.get("asana_error");

    if (connected === "1") {
      setAsanaConnected(true);
      setAsanaMessage("Asana connected successfully.");
      setStep(2);
      window.history.replaceState({}, "", "/onboarding");
      return;
    }

    if (error) {
      setAsanaMessage(asanaErrorMessage(error));
      setStep(2);
      window.history.replaceState({}, "", "/onboarding");
    }
  }, [searchParams, setAsanaConnected, setStep]);

  const handleAsanaConnect = () => {
    if (step3.asanaConnected || !userReady) return;
    setAsanaUserId(userId);
    window.location.href = getAsanaConnectUrl("/onboarding");
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-[21px] font-semibold tracking-[-0.4px] text-foreground">
          Connect your tools
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground">
          Link the services your team already uses. Brisk keeps everything in sync.
        </p>
      </div>

      {asanaMessage ? (
        <p
          className={`mb-4 rounded-lg px-3 py-2 text-[13px] ${
            step3.asanaConnected
              ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "bg-amber-100 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200"
          }`}
        >
          {asanaMessage}
        </p>
      ) : null}

      <div className="flex flex-col gap-3.5 sm:flex-row">
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
          disabled={!userReady}
        />
      </div>

      <p className="mt-3 text-[12px] text-foreground/80">
        GitHub is a demo toggle for now. Asana needs developer keys — optional during
        onboarding.
      </p>

      <div className="mt-7 flex items-center">
        <button
          className="flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          onClick={advanceFromStep3}
        >
          Continue
          <ArrowRight size={17} />
        </button>
        <button
          className="ml-auto px-1.5 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-violet-800 dark:hover:text-violet-400"
          onClick={skipStep3}
        >
          Skip for now
        </button>
      </div>
    </>
  );
}
