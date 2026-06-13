import type { MeetingTranscriptionStatus } from "@/app/meeting";

export const TRANSCRIPTION_STATUS_STYLES: Record<
  MeetingTranscriptionStatus | "none",
  { label: string; className: string }
> = {
  none: { label: "No recording yet", className: "bg-muted text-muted-foreground" },
  pending: { label: "Recording pending", className: "bg-lavender text-lavender-foreground" },
  processing: { label: "Processing", className: "bg-primary/10 text-primary" },
  done: { label: "Ready", className: "bg-sage text-sage-foreground" },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive" },
};
