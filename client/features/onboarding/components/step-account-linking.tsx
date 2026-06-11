"use client";

import { AsanaPatConnectForm } from "@/components/onboarding/asana-pat-connect-form";
import { GithubPatConnectForm } from "@/components/onboarding/github-pat-connect-form";
import {
  OnboardingStepHeading,
  onboardingPanelClassName,
} from "@/components/onboarding/onboarding-layout";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { AccountLinkingState } from "../types";

type StepAccountLinkingProps = {
  userId: string;
  state: AccountLinkingState;
  loading: boolean;
  onGithubConnected: () => void | Promise<void>;
  onAsanaConnected: () => void | Promise<void>;
};

function GithubMark() {
  return (
    <div className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-muted text-xs font-bold text-foreground">
      GH
    </div>
  );
}

function AsanaMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
      <circle cx="11" cy="6" r="3.4" fill="#F06A6A" />
      <circle cx="6" cy="15" r="3.4" fill="#F06A6A" />
      <circle cx="16" cy="15" r="3.4" fill="#F06A6A" />
    </svg>
  );
}

export function StepAccountLinking({
  userId,
  state,
  loading,
  onGithubConnected,
  onAsanaConnected,
}: StepAccountLinkingProps) {
  return (
    <div>
      <OnboardingStepHeading
        title="Link your accounts"
        description="Connect GitHub and Asana with personal access tokens, then provision a Brisk project with a strict 1:1:1 mapping."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <section
          className={cn(
            onboardingPanelClassName,
            state.githubConnected && "border-[#5da283]/30 bg-[#5da283]/5",
          )}
        >
          <div className="mb-4 flex items-center gap-3">
            <GithubMark />
            <div>
              <p className="font-semibold text-foreground">GitHub</p>
              <p className="text-sm text-muted-foreground">
                Repository and project board
              </p>
            </div>
          </div>
          {state.githubConnected ? (
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5da283]">
              <Check className="size-4" />
              {state.githubLogin
                ? `Connected as @${state.githubLogin}`
                : "Connected"}
            </p>
          ) : (
            <GithubPatConnectForm
              userId={userId}
              disabled={loading}
              onConnected={onGithubConnected}
            />
          )}
        </section>

        <section
          className={cn(
            onboardingPanelClassName,
            state.asanaConnected && "border-[#5da283]/30 bg-[#5da283]/5",
          )}
        >
          <div className="mb-4 flex items-center gap-3">
            <AsanaMark />
            <div>
              <p className="font-semibold text-foreground">Asana</p>
              <p className="text-sm text-muted-foreground">
                Tasks and project tracking
              </p>
            </div>
          </div>
          {state.asanaConnected ? (
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5da283]">
              <Check className="size-4" />
              {state.asanaUserName
                ? `Connected as ${state.asanaUserName}`
                : "Connected"}
            </p>
          ) : (
            <AsanaPatConnectForm
              userId={userId}
              disabled={loading}
              onConnected={onAsanaConnected}
            />
          )}
        </section>
      </div>
    </div>
  );
}
