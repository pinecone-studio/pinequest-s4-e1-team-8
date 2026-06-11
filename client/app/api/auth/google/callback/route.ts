import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
};

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function withQuery(path: string, query: string) {
  return path.includes("?") ? `${path}&${query}` : `${path}?${query}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const cookieStore = await cookies();
  const savedRaw = cookieStore.get("google_workspace_oauth_state")?.value;
  let returnTo = "/onboarding/step2";

  if (errorParam) {
    return redirect(withQuery(returnTo, `google_error=${encodeURIComponent(errorParam)}`));
  }

  if (!code) {
    return Response.json({ error: "Missing authorization code" }, { status: 400 });
  }

  if (!savedRaw) {
    return redirect(withQuery(returnTo, "google_error=missing_state"));
  }

  let parsed: { state: string; userId: string; returnTo?: string };
  try {
    parsed = JSON.parse(savedRaw) as { state: string; userId: string; returnTo?: string };
  } catch {
    return redirect(withQuery(returnTo, "google_error=invalid_state"));
  }

  if (parsed.returnTo?.startsWith("/")) {
    returnTo = parsed.returnTo;
  }

  if (!parsed.state || parsed.state !== state) {
    return redirect(withQuery(returnTo, "google_error=state_mismatch"));
  }

  cookieStore.delete("google_workspace_oauth_state");

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return redirect(withQuery(returnTo, "google_error=missing_client_credentials"));
  }

  const redirectUri = `${getBaseUrl(request)}/api/auth/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("[google callback] token exchange failed:", err);
    return redirect(withQuery(returnTo, "google_error=token_exchange_failed"));
  }

  const tokens = (await tokenRes.json()) as GoogleTokenResponse;
  const apiUrl = (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8787"
  ).replace(/\/$/, "");

  if (!parsed.userId) {
    return redirect(withQuery(returnTo, "google_error=missing_user_id"));
  }

  const saveRes = await fetch(`${apiUrl}/api/onboarding/sessions/google/oauth/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: parsed.userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresIn: tokens.expires_in,
    }),
  });

  if (!saveRes.ok) {
    const err = await saveRes.text();
    console.error("[google callback] save tokens failed:", err);
    return redirect(withQuery(returnTo, "google_error=save_failed"));
  }

  redirect(withQuery(returnTo, "google_connected=1"));
}
