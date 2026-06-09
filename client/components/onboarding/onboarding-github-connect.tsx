"use client";

import { useOnboardingStore } from "@/app/onboarding/use-onboarding-store";
import { useInternalUserId } from "@/hooks/use-internal-user-id";
import {
  connectGithubPAT,
  extractApiError,
  fetchGithubStatus,
  setGithubUserId,
} from "@/lib/integrations/github";
import { DEMO_GITHUB_PAT } from "@/lib/onboarding/demo-defaults";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

function GithubMark() {
  return (
    <div className="grid h-6 w-6 place-items-center rounded-full bg-muted/50 text-[13px] font-bold text-foreground">
      GH
    </div>
  );
}

function formatGithubError(err: unknown, fallback: string) {
  const message = extractApiError(err, fallback);
  if (message.includes("401") || message.includes("Bad credentials")) {
    return "Team lead GitHub token is invalid or expired. Check NEXT_PUBLIC_DEMO_GITHUB_PAT in client/.env.local.";
  }
  return message;
}

function maskTeamLeadPat(pat: string) {
  if (pat.length <= 12) return "ghp_••••••••••••";
  return `${pat.slice(0, 4)}••••••••••••••••••••••${pat.slice(-4)}`;
}

export function OnboardingGithubConnect() {
  const { userId, isLoaded: userReady } = useInternalUserId();
  const { step3, setGithubConnected } = useOnboardingStore();
  const [githubLogin, setGithubLogin] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const connectAttemptedRef = useRef(false);

  const connectTeamLeadGithub = useCallback(async () => {
    if (!userReady || !DEMO_GITHUB_PAT) {
      setIsBusy(false);
      return;
    }

    setGithubUserId(userId);
    setIsBusy(true);
    setError(null);

    try {
      const { githubLogin: login } = await connectGithubPAT(DEMO_GITHUB_PAT);
      setGithubLogin(login);
      setGithubConnected(true);
    } catch (err) {
      setGithubConnected(false);
      setError(
        formatGithubError(
          err,
          "Could not connect team lead GitHub — verify NEXT_PUBLIC_DEMO_GITHUB_PAT.",
        ),
      );
    } finally {
      setIsBusy(false);
    }
  }, [setGithubConnected, userId, userReady]);

  useEffect(() => {
    if (!userReady || connectAttemptedRef.current) return;
    connectAttemptedRef.current = true;

    if (!DEMO_GITHUB_PAT) {
      setIsBusy(false);
      setError(
        "Team lead GitHub PAT is not configured. Add NEXT_PUBLIC_DEMO_GITHUB_PAT to client/.env.local.",
      );
      return;
    }

    void connectTeamLeadGithub();
  }, [connectTeamLeadGithub, userReady]);

  const connected = step3.githubConnected;

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
          <GithubMark />
        </div>
        <div>
          <div className="text-[15px] font-semibold text-foreground">GitHub</div>
          <div className="text-[12.5px] text-foreground">
            Team lead repo — sync commits, PRs & issues
          </div>
        </div>
      </div>

      {connected ? (
        <button
          type="button"
          className="flex h-9 w-full cursor-default items-center justify-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-100 text-[13px] font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
          disabled
        >
          <Check size={15} />
          Team lead connected{githubLogin ? ` as @${githubLogin}` : ""}
        </button>
      ) : (
        <div className="space-y-2.5">
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Team lead PAT (demo)
            </p>
            <p className="mt-1 font-mono text-[12px] text-foreground">
              {maskTeamLeadPat(DEMO_GITHUB_PAT)}
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              Onboarding always uses your team lead&apos;s GitHub — not your personal
              account.
            </p>
          </div>
          <button
            type="button"
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-transparent bg-violet-600 text-[13px] font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isBusy || !DEMO_GITHUB_PAT}
            onClick={() => void connectTeamLeadGithub()}
          >
            {isBusy ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {isBusy ? "Connecting team lead GitHub…" : "Connect team lead GitHub"}
          </button>
          {error ? <p className="text-[12px] text-rose-500">{error}</p> : null}
        </div>
      )}
    </div>
  );
}
