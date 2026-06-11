import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SCOPES = [
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/drive.file",
].join(" ");

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return Response.json({ error: "GOOGLE_CLIENT_ID not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo")?.startsWith("/")
    ? url.searchParams.get("returnTo")!
    : "/onboarding/step2";
  const userId = url.searchParams.get("userId")?.trim() ?? "";

  const baseUrl = getBaseUrl(request);
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  const state = crypto.randomUUID();

  const cookieStore = await cookies();
  cookieStore.set(
    "google_workspace_oauth_state",
    JSON.stringify({ state, userId, returnTo }),
    {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    },
  );

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  redirect(authUrl.toString());
}
