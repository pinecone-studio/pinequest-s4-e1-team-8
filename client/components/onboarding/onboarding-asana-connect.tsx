"use client";

import { useOnboardingStore } from "@/app/onboarding/use-onboarding-store";
import { AsanaPatConnectForm } from "@/components/onboarding/asana-pat-connect-form";
import { useInternalUserId } from "@/hooks/use-internal-user-id";
import {
  extractAsanaApiError,
  fetchAsanaStatus,
  setAsanaUserId,
} from "@/lib/integrations/asana";
import { onboardingPanelClassName } from "@/components/onboarding/onboarding-layout";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function AsanaMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" aria-hidden>
      <circle cx="11" cy="6" r="3.4" fill="#F06A6A" />
      <circle cx="6" cy="15" r="3.4" fill="#F06A6A" />
      <circle cx="16" cy="15" r="3.4" fill="#F06A6A" />
    </svg>
  );
}

export function OnboardingAsanaConnect() {
  const { userId, isLoaded: userReady } = useInternalUserId();
  const { step3, setAsanaConnected } = useOnboardingStore();
  const [asanaUserName, setAsanaUserName] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    if (!userReady) {
      return;
    }

    setAsanaUserId(userId);
    setIsBusy(true);
    setError(null);

    try {
      const status = await fetchAsanaStatus();
      if (status.connected) {
        setAsanaUserName(status.asanaUserName ?? null);
        setAsanaConnected(true);
      } else {
        setAsanaConnected(false);
      }
    } catch (err) {
      setAsanaConnected(false);
      setError(extractAsanaApiError(err, "Could not check Asana connection."));
    } finally {
      setIsBusy(false);
    }
  }, [setAsanaConnected, userId, userReady]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handlePatConnected = async (name: string) => {
    setAsanaUserName(name);
    setAsanaConnected(true);
  };

  const connected = step3.asanaConnected;

  return (
    <section
      className={cn(
        onboardingPanelClassName,
        connected && "border-[#5da283]/30 bg-[#5da283]/5",
      )}
    >
      <div className="flex items-start gap-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-border/80 bg-background">
          <AsanaMark />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="space-y-1">
            <h3 className="text-[15px] font-semibold text-foreground">Asana</h3>
            {connected ? (
              <p className="inline-flex items-center gap-1 text-xs font-medium text-[#5da283]">
                <Check className="size-3.5 shrink-0" />
                Connected{asanaUserName ? ` as ${asanaUserName}` : ""}
              </p>
            ) : null}
          </div>
          {!connected ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Import tasks and keep work in sync.
            </p>
          ) : null}
        </div>
        {isBusy && !connected ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      <div className="mt-7">
        {connected ? (
          <p className="text-sm text-[#5da283]">
            Tasks will sync once your project is created.
          </p>
        ) : (
          <AsanaPatConnectForm
            userId={userId}
            disabled={isBusy || !userReady}
            onConnected={handlePatConnected}
          />
        )}
      </div>

      {error ? <p className="mt-5 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
