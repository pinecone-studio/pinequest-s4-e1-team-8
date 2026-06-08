/**
 * GET /api/auth/asana?userId=...
 *
 * Starts Asana OAuth. Register this redirect URI in the Asana developer console:
 * http://localhost:3000/api/auth/asana/callback
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SCOPES = [
  "users:read",
  "workspaces:read",
  "projects:read",
  "tasks:read",
  "tasks:write",
].join(" ");

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request: Request) {
  const clientId = process.env.ASANA_CLIENT_ID?.trim();
  if (!clientId) {
    return Response.json({ error: "ASANA_CLIENT_ID not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  const baseUrl = getBaseUrl(request);
  const redirectUri = `${baseUrl}/api/auth/asana/callback`;
  const state = crypto.randomUUID();

  const cookieStore = await cookies();
  cookieStore.set(
    "asana_oauth_state",
    JSON.stringify({ state, userId }),
    {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    },
  );

  const authUrl = new URL("https://app.asana.com/-/oauth_authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("state", state);

  redirect(authUrl.toString());
}
