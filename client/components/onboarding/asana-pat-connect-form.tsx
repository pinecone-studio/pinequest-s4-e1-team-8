"use client";

import {
  onboardingInputClassName,
  onboardingPrimaryButtonClassName,
} from "@/components/onboarding/onboarding-layout";
import {
  ASANA_TOKEN_URL,
  connectAsanaPAT,
  extractAsanaApiError,
  setAsanaUserId,
} from "@/lib/integrations/asana";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

type AsanaPatConnectFormProps = {
  userId: string;
  disabled?: boolean;
  onConnected: (asanaUserName: string) => void | Promise<void>;
  compact?: boolean;
};

export function AsanaPatConnectForm({
  userId,
  disabled = false,
  onConnected,
  compact = false,
}: AsanaPatConnectFormProps) {
  const [patValue, setPatValue] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!patValue.trim()) {
      return;
    }

    setAsanaUserId(userId);
    setIsBusy(true);
    setError(null);

    try {
      const { asanaUserName } = await connectAsanaPAT(patValue.trim());
      setPatValue("");
      await onConnected(asanaUserName);
    } catch (err) {
      setError(extractAsanaApiError(err, "Could not connect Asana."));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <div className="space-y-2.5">
        <label htmlFor="asana-pat-token" className="text-xs font-medium text-muted-foreground">
          Personal access token
        </label>
        <input
          id="asana-pat-token"
          type="password"
          value={patValue}
          onChange={(event) => setPatValue(event.target.value)}
          placeholder="2/xxxxxxxxxxxxxxxx/xxxxxxxxxxxxxxxx:xxxxxxxx"
          disabled={disabled || isBusy}
          autoComplete="off"
          className={cn(onboardingInputClassName, "font-mono")}
        />
        <p className="text-xs text-muted-foreground">
          Create a token in Asana with access to your workspaces and projects.
        </p>
      </div>
      <button
        type="button"
        className={cn(onboardingPrimaryButtonClassName, "max-w-none")}
        disabled={disabled || isBusy || !patValue.trim()}
        onClick={() => void handleConnect()}
      >
        {isBusy ? <Loader2 className="size-4 animate-spin" /> : null}
        Connect Asana
      </button>
      <a
        href={ASANA_TOKEN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-[#6d8ef7] hover:underline"
      >
        Create a personal access token on Asana
        <ExternalLink className="size-3" />
      </a>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
