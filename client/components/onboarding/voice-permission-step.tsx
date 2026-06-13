"use client";

import { Button } from "@/components/ui/button";
import { MicIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";

type VoicePermissionStepProps = {
  isRequesting: boolean;
  errorMessage: string | null;
  onRequestAccess: () => void;
};

const HIGHLIGHTS = [
  {
    icon: SparklesIcon,
    title: "Personalized for you",
    description: "A short voice sample helps Brisk tailor meeting summaries and insights to you.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Stored securely",
    description: "Your recording is saved to your account and is never shared outside Brisk.",
  },
];

export function VoicePermissionStep({
  isRequesting,
  errorMessage,
  onRequestAccess,
}: VoicePermissionStepProps) {
  return (
    <div className="flex flex-col items-center gap-7 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
        <MicIcon className="size-7" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Set up your voice profile</h1>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          Before you get started, record a short voice sample. It only takes a moment.
        </p>
      </div>

      <ul className="flex w-full max-w-sm flex-col gap-3 text-left">
        {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-background text-primary">
              <Icon className="size-4" />
            </span>
            <span className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-xs leading-5 text-muted-foreground">{description}</p>
            </span>
          </li>
        ))}
      </ul>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <Button
        size="lg"
        className="h-11 min-w-[220px] text-base"
        onClick={onRequestAccess}
        disabled={isRequesting}
      >
        {isRequesting ? "Requesting access…" : "Allow microphone access"}
      </Button>
    </div>
  );
}
