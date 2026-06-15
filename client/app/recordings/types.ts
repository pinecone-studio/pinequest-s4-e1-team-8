export type StandaloneRecordingStatus =
  | "pending"
  | "processing"
  | "done"
  | "failed";

export type StandaloneScriptSegment = {
  speakerLabel: string;
  text: string;
};

export type StandaloneRecording = {
  id: string;
  userId: string;
  title: string;
  audioUrl: string;
  status: StandaloneRecordingStatus;
  speakerCount: number | null;
  transcript: string | null;
  keyPoints: string[] | null;
  scriptSegments: StandaloneScriptSegment[] | null;
  errorMessage: string | null;
  durationSeconds: number | null;
  fileSizeBytes: number | null;
  createdAt: number | string | null;
  updatedAt: number | string | null;
};

export type UploadRecordingResponse = {
  status: "processing";
  recordingId: string;
};

export type ListRecordingsResponse = {
  recordings: StandaloneRecording[];
};
