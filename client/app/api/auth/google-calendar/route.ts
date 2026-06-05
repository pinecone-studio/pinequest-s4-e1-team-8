/**
 * GET /api/auth/google-calendar
 *
 * Initiates a Google OAuth2 flow scoped to Google Calendar (read-only).
 * After the user grants consent, Google redirects to /api/auth/google-calendar/callback.
 *
 * NOTE: Add http://localhost:3000/api/auth/google-calendar/callback (or your
 * production domain equivalent) to the "Authorised redirect URIs" list in your
 * Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return Response.json({ error: 'GOOGLE_CLIENT_ID not configured' }, { status: 500 });
  }

  const baseUrl     = getBaseUrl(request);
  const redirectUri = `${baseUrl}/api/auth/google-calendar/callback`;

  // Random state token to prevent CSRF
  const state = crypto.randomUUID();

  const cookieStore = await cookies();
  cookieStore.set('gcal_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge:   600, // 10 minutes — enough to complete the OAuth dance
    path:     '/',
  });

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id',     clientId);
  authUrl.searchParams.set('redirect_uri',  redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope',         SCOPES);
  authUrl.searchParams.set('access_type',   'offline');  // request refresh token
  authUrl.searchParams.set('prompt',        'consent');  // force consent to get refresh token
  authUrl.searchParams.set('state',         state);

  redirect(authUrl.toString());
}
