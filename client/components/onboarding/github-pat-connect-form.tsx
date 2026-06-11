"use client";

import {
  onboardingInputClassName,
  onboardingPrimaryButtonClassName,
} from "@/components/onboarding/onboarding-layout";
import {
  connectGithubPAT,
  extractApiError,
  GITHUB_TOKEN_URL,
  setGithubUserId,
} from "@/lib/integrations/github";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

type GithubPatConnectFormProps = {
  userId: string;
  disabled?: boolean;
  onConnected: (githubLogin: string) => void | Promise<void>;
  compact?: boolean;
};

export function GithubPatConnectForm({
  userId,
  disabled = false,
  onConnected,
  compact = false,
}: GithubPatConnectFormProps) {
  const [patValue, setPatValue] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!patValue.trim()) {
      return;
    }

    setGithubUserId(userId);
    setIsBusy(true);
    setError(null);

    try {
      const { githubLogin } = await connectGithubPAT(patValue.trim());
      setPatValue("");
      await onConnected(githubLogin);
    } catch (err) {
      setError(extractApiError(err, "Could not connect GitHub."));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <div className="space-y-2.5">
        <label htmlFor="github-pat-token" className="text-xs font-medium text-muted-foreground">
          Personal access token
        </label>
        <input
          id="github-pat-token"
          type="password"
          value={patValue}
          onChange={(event) => setPatValue(event.target.value)}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          disabled={disabled || isBusy}
          autoComplete="off"
          className={cn(onboardingInputClassName, "font-mono")}
        />
        <p className="text-xs text-muted-foreground">
          Needs <span className="font-medium text-foreground">repo</span> and{" "}
          <span className="font-medium text-foreground">project</span> scopes.
        </p>
      </div>
      <button
        type="button"
        className={cn(onboardingPrimaryButtonClassName, "max-w-none")}
        disabled={disabled || isBusy || !patValue.trim()}
        onClick={() => void handleConnect()}
      >
        {isBusy ? <Loader2 className="size-4 animate-spin" /> : null}
        Connect GitHub
      </button>
      <a
        href={GITHUB_TOKEN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-[#6d8ef7] hover:underline"
      >
        Create a personal access token on GitHub
        <ExternalLink className="size-3" />
      </a>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
