/**
 * GET /api/auth/asana/callback?code=...&state=...
 *
 * Exchanges the Asana authorization code for tokens and stores them on the API server.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type AsanaTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  data?: {
    gid: string;
    name: string;
    email?: string;
  };
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
  const savedEarly = cookieStore.get("asana_oauth_state")?.value;
  let returnTo = "/tasks";
  if (savedEarly) {
    try {
      const parsed = JSON.parse(savedEarly) as { returnTo?: string };
      if (parsed.returnTo?.startsWith("/")) {
        returnTo = parsed.returnTo;
      }
    } catch {
      // keep default
    }
  }

  if (errorParam) {
    return redirect(
      withQuery(returnTo, `asana_error=${encodeURIComponent(errorParam)}`),
    );
  }

  if (!code) {
    return Response.json({ error: "Missing authorization code" }, { status: 400 });
  }

  const saved = cookieStore.get("asana_oauth_state")?.value;
  if (!saved) {
    return redirect(withQuery(returnTo, "asana_error=missing_state"));
  }

  let parsed: { state: string; userId: string; returnTo?: string };
  try {
    parsed = JSON.parse(saved) as { state: string; userId: string; returnTo?: string };
  } catch {
    return redirect(withQuery(returnTo, "asana_error=invalid_state"));
  }

  if (parsed.returnTo?.startsWith("/")) {
    returnTo = parsed.returnTo;
  }

  if (!parsed.state || parsed.state !== state) {
    return redirect(withQuery(returnTo, "asana_error=state_mismatch"));
  }

  cookieStore.delete("asana_oauth_state");

  const clientId = process.env.ASANA_CLIENT_ID?.trim();
  const clientSecret = process.env.ASANA_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return redirect(withQuery(returnTo, "asana_error=missing_client_credentials"));
  }

  const redirectUri = `${getBaseUrl(request)}/api/auth/asana/callback`;
  const tokenRes = await fetch("https://app.asana.com/-/oauth_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("[asana callback] token exchange failed:", err);
    let errorCode = "token_exchange_failed";
    try {
      const parsedError = JSON.parse(err) as { error?: string };
      if (parsedError.error === "invalid_client") errorCode = "invalid_client";
    } catch {
      // keep generic code
    }
    return redirect(withQuery(returnTo, `asana_error=${errorCode}`));
  }

  const tokens = (await tokenRes.json()) as AsanaTokenResponse;
  const apiUrl = (
    process.env.ASANA_OAUTH_API_URL ??
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8787"
  ).replace(/\/$/, "");

  const saveRes = await fetch(`${apiUrl}/integrations/asana/oauth/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: parsed.userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresIn: tokens.expires_in,
      asanaUserGid: tokens.data?.gid ?? null,
      asanaUserName: tokens.data?.name ?? null,
      asanaUserEmail: tokens.data?.email ?? null,
    }),
  });

  if (!saveRes.ok) {
    const err = await saveRes.text();
    console.error("[asana callback] save integration failed:", err);
    const hint = saveRes.status === 404 ? "api_not_found" : "save_failed";
    return redirect(
      withQuery(
        returnTo,
        `asana_error=${hint}&asana_source=${encodeURIComponent(apiUrl)}`,
      ),
    );
  }

  redirect(withQuery(returnTo, "asana_connected=1"));
}
