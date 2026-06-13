"use client";

import { useClientApiAuth } from "@/lib/api/auth-interceptor";
import {
  enrollVoice,
  formatVoiceApiError,
  getVoiceStatus,
  verifyVoice,
} from "@/lib/api/voice";
import { syncClerkUser } from "@/lib/api/users";
import {
  recordWavBlob,
  VOICE_RECORD_DURATION_MS,
} from "@/lib/audio/record-wav";
import { markVoiceVerified } from "@/lib/voice/session";
import {
  ORB_CORE_SHADOW,
  orbGradientStyle,
  type OrbVariant,
} from "@/lib/voice/orb-style";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type VoiceMode = "enroll" | "verify";

type VoiceVerificationFormProps = {
  onSuccess?: () => void;
  title?: string;
  description?: string;
  footer?: ReactNode;
};

export function VoiceVerificationForm({
  onSuccess,
  title: titleOverride,
  description: descriptionOverride,
  footer,
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

  const busy = isRecording || isSubmitting;
  const variant: OrbVariant = error
    ? "error"
    : busy
      ? "listening"
      : "idle";
  const gradientStyle = orbGradientStyle(variant);
  const isListening = variant === "listening";

  const label = isLoadingStatus
    ? "Checking voice profile…"
    : isRecording
      ? "Listening…"
      : isSubmitting
        ? mode === "verify"
          ? "Verifying…"
          : "Enrolling…"
        : needsMoreEnrollment
          ? "Tap to record again"
          : mode === "verify"
            ? "Tap to verify"
            : "Tap to enroll";

  const sublabel = error
    ? error
    : isRecording
      ? `Speak naturally — ${countdown}s`
      : isLoadingStatus
        ? ""
        : descriptionOverride ??
          (mode === "verify"
            ? "Confirm it’s really you"
            : "Record a short sample to get started");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-12">
      <div className="flex flex-col items-center gap-7 text-center">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>

        <button
          type="button"
          onClick={() => void handleRecord()}
          disabled={!mode || busy || isLoadingStatus}
          aria-label={label}
          className="group relative grid size-44 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background disabled:cursor-not-allowed"
        >
          {/* Outer ambient glow */}
          <span
            className={cn(
              "pointer-events-none absolute inset-0 rounded-full opacity-60 blur-2xl",
              isListening ? "animate-orb-glow" : "animate-orb-breathe",
            )}
            style={gradientStyle}
          />

          {/* Listening ripples */}
          {isListening ? (
            <>
              <span
                className="pointer-events-none absolute inset-2 rounded-full"
                style={{ ...gradientStyle, animation: "orb-ripple 1.8s ease-out infinite" }}
              />
              <span
                className="pointer-events-none absolute inset-2 rounded-full"
                style={{ ...gradientStyle, animation: "orb-ripple 1.8s ease-out 0.9s infinite" }}
              />
            </>
          ) : null}

          {/* Glassy ring */}
          <span className="pointer-events-none absolute inset-4 rounded-full border border-white/30 bg-white/5 backdrop-blur-sm" />

          {/* Core orb */}
          <span
            className={cn(
              "relative grid size-32 place-items-center overflow-hidden rounded-full transition-transform group-active:scale-95",
              isListening ? "animate-orb-listen" : "animate-orb-breathe",
            )}
            style={{ ...gradientStyle, boxShadow: ORB_CORE_SHADOW }}
          >
            <span className="absolute left-1/2 top-1/2 h-9 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-md animate-orb-shimmer" />
          </span>
        </button>

        <div className="flex min-h-12 flex-col items-center gap-1">
          <p
            className={cn(
              "text-base font-medium",
              error ? "text-destructive" : "text-foreground",
            )}
            role={error ? "alert" : "status"}
          >
            {label}
          </p>
          {sublabel ? (
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              {sublabel}
            </p>
          ) : null}
        </div>

        {footer}
      </div>
    </div>
  );
}
