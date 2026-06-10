"use client";

import { useOnboardingStore } from "@/app/onboarding/use-onboarding-store";
import { useInternalUserId } from "@/hooks/use-internal-user-id";
import {
  connectGithubPAT,
  extractApiError,
  fetchGithubStatus,
  GITHUB_TOKEN_URL,
  setGithubUserId,
} from "@/lib/integrations/github";
import { cn } from "@/lib/utils";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function GithubMark() {
  return (
    <div className="grid h-6 w-6 place-items-center rounded-full bg-muted/50 text-[13px] font-bold text-foreground">
      GH
    </div>
  );
}

export function OnboardingGithubConnect() {
  const { userId, isLoaded: userReady } = useInternalUserId();
  const { step3, setGithubConnected } = useOnboardingStore();
  const [githubLogin, setGithubLogin] = useState<string | null>(null);
  const [patValue, setPatValue] = useState("");
  const [isBusy, setIsBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    if (!userReady) {
      return;
    }

    setGithubUserId(userId);
    setIsBusy(true);
    setError(null);

    try {
      const status = await fetchGithubStatus();
      if (status.connected) {
        setGithubLogin(status.githubLogin ?? null);
        setGithubConnected(true);
      } else {
        setGithubConnected(false);
      }
    } catch (err) {
      setGithubConnected(false);
      setError(extractApiError(err, "Could not check GitHub connection."));
    } finally {
      setIsBusy(false);
    }
  }, [setGithubConnected, userId, userReady]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleConnect = async () => {
    if (!userReady || !patValue.trim()) {
      return;
    }

    setGithubUserId(userId);
    setIsBusy(true);
    setError(null);

    try {
      const { githubLogin: login } = await connectGithubPAT(patValue.trim());
      setPatValue("");
      setGithubLogin(login);
      setGithubConnected(true);
    } catch (err) {
      setGithubConnected(false);
      setError(extractApiError(err, "Could not connect GitHub."));
    } finally {
      setIsBusy(false);
    }
  };

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
            Sync commits, PRs & issues
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
          Connected{githubLogin ? ` as @${githubLogin}` : ""}
        </button>
      ) : (
        <div className="space-y-2.5">
          <input
            type="password"
            value={patValue}
            onChange={(event) => setPatValue(event.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            disabled={isBusy}
            className="h-9 w-full rounded-lg border border-border/70 bg-background px-3 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:opacity-50"
          />
          <button
            type="button"
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-transparent bg-violet-600 text-[13px] font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isBusy || !patValue.trim()}
            onClick={() => void handleConnect()}
          >
            {isBusy ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {isBusy ? "Connecting GitHub…" : "Connect GitHub"}
          </button>
          <a
            href={GITHUB_TOKEN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-violet-700 hover:underline dark:text-violet-400"
          >
            Create a personal access token
            <ExternalLink className="size-3" />
          </a>
          {error ? <p className="text-[12px] text-rose-500">{error}</p> : null}
        </div>
      )}
    </div>
  );
}
