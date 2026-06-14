export type TranscriptLanguage = "en" | "mn";

export const TRANSCRIPT_LANGUAGE_LABELS: Record<TranscriptLanguage, string> = {
  en: "English",
  mn: "Монгол",
};

export const parseTranscriptLanguage = (value?: string | null): TranscriptLanguage =>
  value === "mn" ? "mn" : "en";
