"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { useClientApiAuth } from "@/lib/api/auth-interceptor";
import { syncClerkUser } from "@/lib/api/users";
import {
  enrollVoice,
  formatVoiceApiError,
  getVoiceStatus,
  verifyVoice,
} from "@/lib/api/voice";
import {
  recordWavBlob,
  VOICE_RECORD_DURATION_MS,
} from "@/lib/audio/record-wav";
import { markVoiceVerified } from "@/lib/voice/session";
import { useUser } from "@clerk/nextjs";
import { Loader2, Mic, ShieldCheck } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type VoiceMode = "enroll" | "verify";

type VoiceVerificationFormProps = {
  onSuccess?: () => void;
  title?: string;
  description?: string;
  footer?: ReactNode;
  variant?: "page" | "embedded";
};

export function VoiceVerificationForm({
  onSuccess,
  title: titleOverride,
  description: descriptionOverride,
  footer,
  variant = "page",
}: VoiceVerificationFormProps) {
  useClientApiAuth();

  const { user, isLoaded } = useUser();
  const [mode, setMode] = useState<VoiceMode | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [needsMoreEnrollment, setNeedsMoreEnrollment] = useState(false);
  const syncedRef = useRef<string | null>(null);

  const finishSuccess = useCallback(() => {
    markVoiceVerified();
    onSuccess?.();
  }, [onSuccess]);

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    const email = user.primaryEmailAddress?.emailAddress?.trim();
    const name = user.fullName?.trim() || user.firstName?.trim() || email;

    if (!email || !name || syncedRef.current === user.id) {
      return;
    }

    syncedRef.current = user.id;

    syncClerkUser({
      clerkId: user.id,
      email,
      name,
      avatarUrl: user.imageUrl ?? null,
    }).catch(() => {
      syncedRef.current = null;
    });
  }, [isLoaded, user]);

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    let cancelled = false;

    const loadStatus = async () => {
      setIsLoadingStatus(true);
      setError("");

      try {
        const status = await getVoiceStatus();
        if (cancelled) {
          return;
        }

        setMode(status.enrolled ? "verify" : "enroll");
      } catch (caughtError) {
        if (!cancelled) {
          setError(formatVoiceApiError(caughtError));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingStatus(false);
        }
      }
    };

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user]);

  const handleRecord = async () => {
    if (!mode || isRecording || isSubmitting) {
      return;
    }

    setError("");
    setIsRecording(true);
    setCountdown(Math.ceil(VOICE_RECORD_DURATION_MS / 1000));

    const countdownTimer = window.setInterval(() => {
      setCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    try {
      const audio = await recordWavBlob(VOICE_RECORD_DURATION_MS);
      setIsRecording(false);
      setIsSubmitting(true);

      if (mode === "enroll") {
        const result = await enrollVoice(audio);

        if (result.enrolled) {
          finishSuccess();
          return;
        }

        setNeedsMoreEnrollment(true);
        setError(
          "Almost there. Record once more so we can finish enrolling your voice.",
        );
        return;
      }

      await verifyVoice(audio);
      finishSuccess();
    } catch (caughtError) {
      setError(formatVoiceApiError(caughtError));
    } finally {
      window.clearInterval(countdownTimer);
      setCountdown(0);
      setIsRecording(false);
      setIsSubmitting(false);
    }
  };

  const title =
    titleOverride ??
    (mode === "verify" ? "Verify your voice" : "Enroll your voice");
  const description =
    descriptionOverride ??
    (mode === "verify"
      ? "Speak naturally for a few seconds so Brisk can confirm it is really you."
      : "Record a short voice sample once. Brisk will use it before you join meetings.");

  const content = (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        {mode === "verify" ? (
          <ShieldCheck className="size-7" />
        ) : (
          <Mic className="size-7" />
        )}
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      {isLoadingStatus ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Checking voice profile...
        </div>
      ) : (
        <>
          <Button
            type="button"
            size="lg"
            className="h-11 min-w-[220px] gap-2 px-5 text-base [&_svg:not([class*='size-'])]:size-5"
            disabled={!mode || isRecording || isSubmitting}
            onClick={() => void handleRecord()}
          >
            {isRecording ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Recording {countdown}s
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Verifying...
              </>
            ) : needsMoreEnrollment ? (
              "Record again"
            ) : (
              <>
                <Mic className="size-5" />
                {mode === "verify" ? "Verify voice" : "Start recording"}
              </>
            )}
          </Button>
        </>
      )}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {footer}
    </div>
  );

  return variant === "embedded" ? content : <AuthShell>{content}</AuthShell>;
}
