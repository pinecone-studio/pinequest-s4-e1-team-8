import { D1Database } from "@cloudflare/workers-types";

export interface Bindings {
  DB: D1Database;
  CLIENT_APP_URL?: string;
  CLERK_PUBLISHABLE_KEY?: string;
  CLERK_SECRET_KEY?: string;
  CLERK_WEBHOOK_SECRET: string;
  CHIMEGE_API_KEY: string;
  CHIMEGE_BASE_URL?: string;
  GROQ_API_KEY?: string;
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
}

export interface Variables {
  userId: string;
}
