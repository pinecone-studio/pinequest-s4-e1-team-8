"use client";

import { useClientApiAuth } from "@/lib/api/auth-interceptor";
import {
  enrollVoice,
  formatVoiceApiError,
  getVoiceStatus,
  verifyVoice,
} from "@/lib/api/voice";
import { recordWavBlob, VOICE_RECORD_DURATION_MS } from "@/lib/audio/record-wav";
import { ORB_CORE_SHADOW, orbGradientStyle } from "@/lib/voice/orb-style";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type OrbState = "loading" | "idle" | "listening" | "success" | "error";

export function VoiceVerificationPanel() {
  useClientApiAuth();

  const [enrolled, setEnrolled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [orb, setOrb] = useState<OrbState>("loading");
  const [label, setLabel] = useState("Preparing…");
  const [sublabel, setSublabel] = useState<string>("");

  const seconds = Math.round(VOICE_RECORD_DURATION_MS / 1000);

  const refreshStatus = async () => {
    try {
      const status = await getVoiceStatus();
      setEnrolled(status.enrolled);
      setOrb("idle");
      setLabel(status.enrolled ? "Tap to verify" : "Tap to enroll");
      setSublabel(
        status.enrolled
          ? "Confirm it’s really you"
          : "Record your voice to get started",
      );
    } catch (error) {
      setEnrolled(false);
      setOrb("error");
      setLabel("Couldn’t load voice status");
      setSublabel(formatVoiceApiError(error));
    }
  };

  useEffect(() => {
    void refreshStatus();
  }, []);

  const handlePress = async () => {
    if (busy || orb === "loading") return;

    const mode = enrolled ? "verify" : "enroll";
    setBusy(true);
    setOrb("listening");
    setLabel("Listening…");
    setSublabel(`Speak naturally for ${seconds}s`);

    try {
      const audio = await recordWavBlob(VOICE_RECORD_DURATION_MS);

      if (mode === "enroll") {
        const result = await enrollVoice(audio);
        if (result.enrolled) {
          setEnrolled(true);
          setOrb("success");
          setLabel("Voice enrolled");
          setSublabel("Tap again to verify");
        } else {
          setOrb("idle");
          setLabel("Almost there");
          setSublabel("Tap once more to finish enrolling");
        }
      } else {
        const result = await verifyVoice(audio);
        setOrb("success");
        setLabel("Verified — it’s you");
        setSublabel(
          typeof result.score === "number"
            ? `Match score ${result.score.toFixed(2)}`
            : "Identity confirmed",
        );
      }
    } catch (error) {
      setOrb("error");
      setLabel(enrolled ? "Verification failed" : "Enrollment failed");
      setSublabel(formatVoiceApiError(error));
    } finally {
      setBusy(false);
    }
  };

  const gradientStyle = orbGradientStyle(orb === "loading" ? "idle" : orb);
  const isListening = orb === "listening";

  return (
    <div className="flex shrink-0 flex-col items-center justify-center gap-5 rounded-3xl border border-border bg-gradient-to-b from-ink/[0.03] to-transparent py-10 dark:from-white/[0.02]">
      <button
        type="button"
        onClick={() => void handlePress()}
        disabled={busy || orb === "loading"}
        aria-label={label}
        className="group relative grid size-40 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background disabled:cursor-not-allowed"
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
        <span className="pointer-events-none absolute inset-3 rounded-full border border-white/30 bg-white/5 backdrop-blur-sm" />

        {/* Core orb */}
        <span
          className={cn(
            "relative grid size-28 place-items-center overflow-hidden rounded-full transition-transform group-active:scale-95",
            isListening ? "animate-orb-listen" : "animate-orb-breathe",
          )}
          style={{ ...gradientStyle, boxShadow: ORB_CORE_SHADOW }}
        >
          {/* Inner light highlight */}
          <span className="absolute left-1/2 top-1/2 h-8 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-md animate-orb-shimmer" />
        </span>
      </button>

      <div className="flex min-h-12 flex-col items-center gap-1 text-center">
        <p
          className={cn(
            "text-base font-medium",
            orb === "error"
              ? "text-destructive"
              : orb === "success"
                ? "text-sage-foreground"
                : "text-foreground",
          )}
          role="status"
        >
          {label}
        </p>
        {sublabel ? (
          <p className="max-w-xs text-sm text-muted-foreground">{sublabel}</p>
        ) : null}
      </div>
    </div>
  );
}
