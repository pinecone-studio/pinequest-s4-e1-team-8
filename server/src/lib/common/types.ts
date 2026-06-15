import { D1Database, Queue, R2Bucket } from "@cloudflare/workers-types";

export type MeetingTranscriptionJob = {
  egressId: string;
  recordingUrl: string;
  userId?: string | null;
};

export type StandaloneRecordingJob = {
  type: "standalone";
  recordingId: string;
  userId: string;
};

// Discriminated union of everything the worker's single `queue` handler can
// receive. Meeting jobs carry no `type`; standalone recording jobs set
// `type: "standalone"`.
export type TranscriptionQueueJob =
  | MeetingTranscriptionJob
  | StandaloneRecordingJob;

export interface Bindings {
  DB: D1Database;
  ENVIRONMENT?: string;
  D1_DATABASE_NAME?: string;
  CLIENT_APP_URL?: string;
  CLERK_PUBLISHABLE_KEY?: string;
  CLERK_SECRET_KEY?: string;
  CLERK_WEBHOOK_SECRET: string;
  CHIMEGE_API_KEY: string;
  CHIMEGE_BASE_URL?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GITHUB_OAUTH_REDIRECT_URI?: string;
  GITHUB_TEST_TOKEN?: string;
  GITHUB_WEBHOOK_SECRET: string;
  ASANA_CLIENT_ID?: string;
  ASANA_CLIENT_SECRET?: string;
  ASANA_TEST_TOKEN?: string;
  LIVEKIT_URL: string;
  LIVEKIT_WS_URL?: string;
  LIVEKIT_API_URL?: string;
  LIVEKIT_EGRESS_WEBHOOK_URL?: string;
  LIVEKIT_API_KEY: string;
  LIVEKIT_API_SECRET: string;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  // Native R2 binding used by the standalone Voice Recordings feature to
  // store and fetch uploaded audio directly (no SigV4 round-trip).
  R2_BUCKET: R2Bucket;
  MEETING_TRANSCRIPTION_QUEUE: Queue<MeetingTranscriptionJob>;
  TRANSCRIPTION_QUEUE: Queue<StandaloneRecordingJob>;
  FRONTEND_URL?: string;
  GEMINI_API_KEY?: string;
  ENCRYPTION_KEY?: string;
}

export interface Variables {
  userId: string;
}
