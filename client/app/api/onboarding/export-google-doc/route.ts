import { auth } from "@clerk/nextjs/server";
import { createGoogleDocFromTddLayout, refreshGoogleAccessToken } from "@/app/lib/google-docs";
import { decryptToken } from "@/lib/crypto/token-encryption";
import type { TddLayoutState } from "@/lib/onboarding/tdd-types";
import { buildBackendAuthHeaders } from "@/lib/api/backend-auth";

type ExportRequestBody = {
  sessionId?: unknown;
  projectName?: unknown;
  tddLayoutState?: unknown;
};

type GoogleTokensResponse = {
  connected: boolean;
  encryptedGoogleAccessToken?: string;
  encryptedGoogleRefreshToken?: string | null;
  googleTokenExpiry?: number | null;
};

function getApiUrl(): string {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8787"
  ).replace(/\/$/, "");
}

function isTddLayoutState(value: unknown): value is TddLayoutState {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as TddLayoutState;
  return Array.isArray(record.blocks);
}

export async function POST(request: Request) {
  const { userId: clerkUserId, getToken } = await auth();
  if (!clerkUserId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = (await request.json().catch(() => null)) as ExportRequestBody | null;
  if (!raw || typeof raw !== "object") {
    return Response.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }

  const sessionId = typeof raw.sessionId === "string" ? raw.sessionId.trim() : "";
  const projectName = typeof raw.projectName === "string" ? raw.projectName.trim() : "Brisk Project";

  if (!isTddLayoutState(raw.tddLayoutState)) {
    return Response.json({ error: "tddLayoutState with blocks is required." }, { status: 400 });
  }

  const token = await getToken();
  const headers = await buildBackendAuthHeaders(async () => token);
  const apiUrl = getApiUrl();

  const tokensRes = await fetch(`${apiUrl}/api/onboarding/sessions/google/tokens`, {
    headers,
    credentials: "include",
  });

  if (!tokensRes.ok) {
    return Response.json({ error: "Failed to load Google credentials." }, { status: 502 });
  }

  const tokensData = (await tokensRes.json()) as GoogleTokensResponse;
  if (!tokensData.connected || !tokensData.encryptedGoogleAccessToken) {
    return Response.json(
      { error: "Google Workspace is not connected.", code: "GOOGLE_NOT_CONNECTED" },
      { status: 401 },
    );
  }

  const encryptionKey = process.env.ENCRYPTION_KEY ?? "";
  let accessToken = await decryptToken(tokensData.encryptedGoogleAccessToken, encryptionKey);
  const refreshToken = tokensData.encryptedGoogleRefreshToken
    ? await decryptToken(tokensData.encryptedGoogleRefreshToken, encryptionKey)
    : null;
  let expiryMs = tokensData.googleTokenExpiry ?? null;

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return Response.json({ error: "Google OAuth is not configured." }, { status: 500 });
  }

  const authClient = {
    accessToken,
    refreshToken,
    expiryMs,
    clientId,
    clientSecret,
  };

  if (expiryMs && expiryMs < Date.now() + 60_000 && refreshToken) {
    const refreshed = await refreshGoogleAccessToken(authClient);
    accessToken = refreshed.accessToken;
    expiryMs = refreshed.expiryMs;
    authClient.accessToken = accessToken;
    authClient.expiryMs = expiryMs;
  }

  try {
    const { documentUrl } = await createGoogleDocFromTddLayout(
      authClient,
      projectName,
      raw.tddLayoutState,
    );

    if (sessionId) {
      await fetch(`${apiUrl}/api/onboarding/sessions/${sessionId}`, {
        method: "PATCH",
        headers,
        credentials: "include",
        body: JSON.stringify({ docUrl: documentUrl, status: "CONCLUDED" }),
      });
    }

    return Response.json({ docUrl: documentUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Docs export failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
