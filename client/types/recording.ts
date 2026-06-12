import type { ActionItem } from "./meeting";

export type RecordingSource = "upload" | "live";
export type RecordingStatus = "processing" | "ready" | "failed";

export type ProcessingStage =
  | "uploading"
  | "noise-canceling"
  | "transcribing"
  | "summarizing";

export type TranscriptEntry = {
  id: string;
  speaker: string;
  textEn: string;
  textMn: string;
  timestampLabel: string;
};

export type Recording = {
  id: string;
  title: string;
  source: RecordingSource;
  status: RecordingStatus;
  createdAt: string;
  durationLabel: string;
  team?: string;
  summary: string;
  actionItems: ActionItem[];
  transcript: TranscriptEntry[];
};
