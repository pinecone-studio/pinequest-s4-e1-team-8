/**
 * GET /api/auth/google-calendar/callback?code=...&state=...
 *
 * Receives the authorization code from Google, exchanges it for access + refresh
 * tokens, then stores them in an encrypted HTTP-only cookie before redirecting
 * back to the dashboard.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface GoogleTokenResponse {
  access_token:  string;
  refresh_token?: string;
  expires_in:    number;
  token_type:    string;
  scope:         string;
}

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request: Request) {
  const url         = new URL(request.url);
  const code        = url.searchParams.get('code');
  const state       = url.searchParams.get('state');
  const errorParam  = url.searchParams.get('error');

  if (errorParam) {
    return redirect(`/dashboard?gcal_error=${encodeURIComponent(errorParam)}`);
  }

  if (!code) {
    return Response.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  // Validate state to prevent CSRF
  const cookieStore   = await cookies();
  const savedState    = cookieStore.get('gcal_oauth_state')?.value;
  if (!savedState || savedState !== state) {
    return Response.json({ error: 'Invalid OAuth state' }, { status: 400 });
  }
  cookieStore.delete('gcal_oauth_state');

  const clientId     = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri  = `${getBaseUrl(request)}/api/auth/google-calendar/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     clientId,
      client_secret: clientSecret,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
    }).toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error('[gcal callback] token exchange failed:', err);
    return redirect(`/dashboard?gcal_error=token_exchange_failed`);
  }

  const tokens: GoogleTokenResponse = await tokenRes.json();

  // Persist tokens in an HTTP-only cookie so the calendar API route can use them
  const tokenPayload = JSON.stringify({
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expiry_ms:     Date.now() + tokens.expires_in * 1000,
  });

  cookieStore.set('gcal_token', tokenPayload, {
    httpOnly: true,
    sameSite: 'lax',
    // 90 days — refresh token keeps it alive well past this
    maxAge: 90 * 24 * 60 * 60,
    path:   '/',
  });

  redirect('/dashboard?gcal_connected=1');
}
