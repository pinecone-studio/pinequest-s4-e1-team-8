import { D1Database } from "@cloudflare/workers-types";

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
  GROQ_API_KEY?: string;
  GROQ_GENERATIVE_API_KEY?: string;
  GROQ_MEETING_API_KEY?: string;
  GROQ_MODEL?: string;
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
  FRONTEND_URL?: string;
  GEMINI_API_KEY?: string;
  ENCRYPTION_KEY?: string;
  AZURE_SPEECH_KEY?: string;
  AZURE_SPEECH_REGION?: string;
  VOICE_VERIFICATION_MODE?: string;
  // Local testing only: when "true", voice routes fall back to a fixed dev user
  // if no Clerk session is present. Never set this in production.
  VOICE_DEV_BYPASS?: string;
}

export interface Variables {
  userId: string;
}
