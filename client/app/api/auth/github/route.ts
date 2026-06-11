/**
 * GET /api/auth/github?userId=...
 *
 * Starts GitHub OAuth. Register this redirect URI in your GitHub OAuth App:
 * http://localhost:3000/api/auth/github/callback
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SCOPES = ["repo", "read:org", "project", "read:user"].join(" ");

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function withQuery(path: string, query: string) {
  return path.includes("?") ? `${path}&${query}` : `${path}?${query}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo")?.trim() || "/onboarding/step2";
  const safeReturnTo = returnTo.startsWith("/") ? returnTo : "/onboarding/step2";

  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  if (!clientId) {
    return redirect(withQuery(safeReturnTo, "github_error=not_configured"));
  }

  const userId = url.searchParams.get("userId");
  if (!userId) {
    return redirect(withQuery(safeReturnTo, "github_error=missing_user"));
  }

  const baseUrl = getBaseUrl(request);
  const redirectUri = `${baseUrl}/api/auth/github/callback`;
  const state = crypto.randomUUID();

  const cookieStore = await cookies();
  cookieStore.set(
    "github_oauth_state",
    JSON.stringify({ state, userId, returnTo: safeReturnTo }),
    {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    },
  );

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("state", state);

  redirect(authUrl.toString());
}
