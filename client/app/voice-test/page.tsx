"use client";

import { Button } from "@/components/ui/button";
import { useClientApiAuth } from "@/lib/api/auth-interceptor";
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
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";

type LogEntry = { time: string; label: string; data: unknown };

export default function VoiceTestPage() {
  useClientApiAuth();

  const { isLoaded, isSignedIn } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const append = (label: string, data: unknown) => {
    setLogs((prev) => [
      { time: new Date().toLocaleTimeString(), label, data },
      ...prev,
    ]);
  };

  const run = async (label: string, action: () => Promise<unknown>) => {
    if (busy) {
      return;
    }
    setBusy(label);
    try {
      const result = await action();
      append(`${label} ✓`, result);
    } catch (error) {
      append(`${label} ✗`, formatVoiceApiError(error));
    } finally {
      setBusy(null);
    }
  };

  const recordThen = async (
    submit: (audio: Blob) => Promise<unknown>,
  ): Promise<unknown> => {
    const audio = await recordWavBlob(VOICE_RECORD_DURATION_MS);
    return submit(audio);
  };

  const seconds = Math.round(VOICE_RECORD_DURATION_MS / 1000);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Voice identity test</h1>
        <p className="text-sm text-muted-foreground">
          Exercises the Azure voice endpoints directly. Each record button
          captures ~{seconds}s of mic audio, converts it to 16&nbsp;kHz mono
          WAV, and posts it to the backend.
        </p>
      </div>

      {isLoaded && !isSignedIn ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          You are not signed in. Log in at{" "}
          <a className="underline" href="/login">
            /login
          </a>{" "}
          first — the endpoints require a Clerk session.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={Boolean(busy)}
          onClick={() => void run("status", getVoiceStatus)}
        >
          {busy === "status" ? "Checking..." : "Check status"}
        </Button>

        <Button
          type="button"
          disabled={Boolean(busy)}
          onClick={() =>
            void run("enroll", () => recordThen(enrollVoice))
          }
        >
          {busy === "enroll" ? `Recording ${seconds}s...` : "Record + enroll"}
        </Button>

        <Button
          type="button"
          disabled={Boolean(busy)}
          onClick={() =>
            void run("verify", () => recordThen(verifyVoice))
          }
        >
          {busy === "verify" ? `Recording ${seconds}s...` : "Record + verify"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          disabled={Boolean(busy)}
          onClick={() => setLogs([])}
        >
          Clear log
        </Button>
      </div>

      <div className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No results yet. Start with “Check status”.
          </p>
        ) : (
          logs.map((entry, index) => (
            <pre
              key={`${entry.time}-${index}`}
              className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs"
            >
              <span className="font-semibold">
                [{entry.time}] {entry.label}
              </span>
              {"\n"}
              {typeof entry.data === "string"
                ? entry.data
                : JSON.stringify(entry.data, null, 2)}
            </pre>
          ))
        )}
      </div>
    </main>
  );
}
