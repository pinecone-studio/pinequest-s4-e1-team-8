/**
 * GET /api/auth/github/callback?code=...&state=...
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type GithubTokenResponse = {
  access_token: string;
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
  const savedEarly = cookieStore.get("github_oauth_state")?.value;
  let returnTo = "/onboarding/step2";
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
    return redirect(withQuery(returnTo, `github_error=${encodeURIComponent(errorParam)}`));
  }

  if (!code) {
    return Response.json({ error: "Missing authorization code" }, { status: 400 });
  }

  const saved = cookieStore.get("github_oauth_state")?.value;
  if (!saved) {
    return redirect(withQuery(returnTo, "github_error=missing_state"));
  }

  let parsed: { state: string; userId: string; returnTo?: string };
  try {
    parsed = JSON.parse(saved) as { state: string; userId: string; returnTo?: string };
  } catch {
    return redirect(withQuery(returnTo, "github_error=invalid_state"));
  }

  if (parsed.returnTo?.startsWith("/")) {
    returnTo = parsed.returnTo;
  }

  if (!parsed.state || parsed.state !== state) {
    return redirect(withQuery(returnTo, "github_error=state_mismatch"));
  }

  cookieStore.delete("github_oauth_state");

  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return redirect(withQuery(returnTo, "github_error=missing_client_credentials"));
  }

  const redirectUri = `${getBaseUrl(request)}/api/auth/github/callback`;
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("[github callback] token exchange failed:", err);
    return redirect(withQuery(returnTo, "github_error=token_exchange_failed"));
  }

  const tokens = (await tokenRes.json()) as GithubTokenResponse;
  const apiUrl = (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8787"
  ).replace(/\/$/, "");

  const saveRes = await fetch(`${apiUrl}/integrations/github/oauth/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: parsed.userId,
      accessToken: tokens.access_token,
    }),
  });

  if (!saveRes.ok) {
    const err = await saveRes.text();
    console.error("[github callback] save integration failed:", err);
    const hint = saveRes.status === 404 ? "api_not_found" : "save_failed";
    return redirect(withQuery(returnTo, `github_error=${hint}`));
  }

  redirect(withQuery(returnTo, "github_connected=1"));
}
