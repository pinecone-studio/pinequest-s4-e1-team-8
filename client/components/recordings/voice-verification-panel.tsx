"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useClientApiAuth } from "@/lib/api/auth-interceptor";
import {
  enrollVoice,
  formatVoiceApiError,
  getVoiceStatus,
  verifyVoice,
} from "@/lib/api/voice";
import { recordWavBlob, VOICE_RECORD_DURATION_MS } from "@/lib/audio/record-wav";
import { CheckCircle2Icon, MicIcon, ShieldCheckIcon, XCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";

type PanelState = {
  kind: "idle" | "success" | "error";
  message: string;
  score?: number | null;
};

export function VoiceVerificationPanel() {
  useClientApiAuth();

  const [enrolled, setEnrolled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<"enroll" | "verify" | null>(null);
  const [state, setState] = useState<PanelState>({ kind: "idle", message: "" });

  const seconds = Math.round(VOICE_RECORD_DURATION_MS / 1000);

  const refreshStatus = async () => {
    try {
      const status = await getVoiceStatus();
      setEnrolled(status.enrolled);
    } catch (error) {
      setEnrolled(false);
      setState({ kind: "error", message: formatVoiceApiError(error) });
    }
  };

  useEffect(() => {
    void refreshStatus();
  }, []);

  const handleEnroll = async () => {
    if (busy) return;
    setBusy("enroll");
    setState({ kind: "idle", message: `Recording ${seconds}s — speak naturally...` });
    try {
      const audio = await recordWavBlob(VOICE_RECORD_DURATION_MS);
      const result = await enrollVoice(audio);
      if (result.enrolled) {
        setEnrolled(true);
        setState({ kind: "success", message: "Voice enrolled. You can verify now." });
      } else {
        setState({
          kind: "idle",
          message: "Almost there — record once more to finish enrolling.",
        });
      }
    } catch (error) {
      setState({ kind: "error", message: formatVoiceApiError(error) });
    } finally {
      setBusy(null);
    }
  };

  const handleVerify = async () => {
    if (busy) return;
    setBusy("verify");
    setState({ kind: "idle", message: `Recording ${seconds}s — speak naturally...` });
    try {
      const audio = await recordWavBlob(VOICE_RECORD_DURATION_MS);
      const result = await verifyVoice(audio);
      setState({
        kind: "success",
        message: "Voice verified — it's you.",
        score: result.score,
      });
    } catch (error) {
      setState({ kind: "error", message: formatVoiceApiError(error), score: null });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="size-4 text-primary" />
          <CardTitle>Voice verification</CardTitle>
          {enrolled !== null ? (
            <Badge variant="outline" className="ml-1">
              {enrolled ? "Enrolled" : "Not enrolled"}
            </Badge>
          ) : null}
        </div>
        <CardDescription>
          Confirm it&apos;s really you before accessing recordings. Enroll once, then verify.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" disabled={Boolean(busy)} onClick={() => void handleEnroll()}>
            <MicIcon />
            {busy === "enroll" ? `Recording ${seconds}s...` : enrolled ? "Re-enroll" : "Enroll voice"}
          </Button>
          <Button
            size="sm"
            disabled={Boolean(busy) || enrolled === false}
            onClick={() => void handleVerify()}
          >
            <ShieldCheckIcon />
            {busy === "verify" ? `Recording ${seconds}s...` : "Verify voice"}
          </Button>
        </div>

        {state.message ? (
          <div
            className={
              state.kind === "success"
                ? "flex items-center gap-2 text-sm text-sage-foreground"
                : state.kind === "error"
                  ? "flex items-center gap-2 text-sm text-destructive"
                  : "flex items-center gap-2 text-sm text-muted-foreground"
            }
            role="status"
          >
            {state.kind === "success" ? (
              <CheckCircle2Icon className="size-4" />
            ) : state.kind === "error" ? (
              <XCircleIcon className="size-4" />
            ) : null}
            <span>
              {state.message}
              {typeof state.score === "number"
                ? ` (match score ${state.score.toFixed(2)})`
                : ""}
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
