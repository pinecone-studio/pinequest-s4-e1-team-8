import { D1Database } from "@cloudflare/workers-types";

export interface Bindings {
  DB: D1Database;
  CHIMEGE_API_KEY: string;
  CHIMEGE_BASE_URL?: string;
  LIVEKIT_URL: string;
  LIVEKIT_WS_URL?: string;
  LIVEKIT_API_URL?: string;
  LIVEKIT_API_KEY: string;
  LIVEKIT_API_SECRET: string;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GITHUB_OAUTH_REDIRECT_URI?: string;
  CLIENT_APP_URL?: string;
}
