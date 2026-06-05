/**
 * GET  /api/google-calendar?weekStart=<unix-ms>
 *
 * Fetches Google Calendar events for the requested week using the Calendar
 * OAuth token stored in the gcal_token cookie (set by the auth/google-calendar
 * callback route). Automatically refreshes an expired access token.
 *
 * Returns { connected: false } when no token cookie exists so the client can
 * show a "Connect Google Calendar" prompt.
 *
 * PATCH /api/google-calendar
 * Reschedules an event on Google Calendar (drag-and-drop optimistic update).
 */

import { cookies } from 'next/headers';
import type { CalendarEvent, CalendarEventType, EventColor } from '@/lib/dashboard/calendar-types';

// ─── Token helpers ─────────────────────────────────────────────────────────────

interface StoredToken {
  access_token:  string;
  refresh_token: string | null;
  expiry_ms:     number;
}

async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get('gcal_token')?.value;
  if (!raw) return null;

  let stored: StoredToken;
  try { stored = JSON.parse(raw); } catch { return null; }

  // Token still valid (with 60 s buffer)
  if (stored.expiry_ms - Date.now() > 60_000) return stored.access_token;

  // Attempt refresh
  if (!stored.refresh_token) return null;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: stored.refresh_token,
      grant_type:    'refresh_token',
    }).toString(),
  });

  if (!res.ok) return null;

  const refreshed = (await res.json()) as { access_token: string; expires_in: number };

  const updated: StoredToken = {
    access_token:  refreshed.access_token,
    refresh_token: stored.refresh_token,
    expiry_ms:     Date.now() + refreshed.expires_in * 1000,
  };

  cookieStore.set('gcal_token', JSON.stringify(updated), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 90 * 24 * 60 * 60,
    path: '/',
  });

  return updated.access_token;
}

// ─── Google Calendar normalisation ────────────────────────────────────────────

const COLOR_MAP: Record<string, EventColor> = {
  '1': 'blue', '2': 'emerald', '3': 'violet', '4': 'pink',
  '5': 'gold', '6': 'cyan',    '7': 'blue',   '8': 'gold',
  '9': 'blue', '10': 'emerald','11': 'violet',
};

const AVATAR_COLORS = [
  '#8b5cf6','#3b82f6','#ec4899','#f5d565','#34d399','#22d3ee',
];

interface GCalItem {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
  end:   { dateTime?: string; date?: string };
  conferenceData?: { entryPoints?: Array<{ entryPointType: string; uri: string }> };
  attendees?: Array<{ email: string; displayName?: string }>;
  colorId?: string;
}

function normaliseItem(item: GCalItem): CalendarEvent | null {
  const isAllDay  = Boolean(item.start.date && !item.start.dateTime);
  const startUnix = isAllDay
    ? new Date(item.start.date!).getTime()
    : new Date(item.start.dateTime!).getTime();
  const endUnix = isAllDay
    ? new Date(item.end.date!).getTime()
    : new Date(item.end.dateTime!).getTime();

  if (isNaN(startUnix) || isNaN(endUnix)) return null;

  const meetEntry = item.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video');
  const type: CalendarEventType = isAllDay ? 'all-day' : meetEntry ? 'meeting' : 'task';
  const color: EventColor = COLOR_MAP[item.colorId ?? ''] ?? (meetEntry ? 'blue' : 'violet');

  return {
    id:      item.id,
    type,
    title:   item.summary ?? '(No title)',
    startUnix,
    endUnix,
    color,
    meetUrl: meetEntry?.uri,
    attendees: (item.attendees ?? []).slice(0, 5).map((a, i) => ({
      email:       a.email,
      displayName: a.displayName,
      initials:    (a.displayName ?? a.email).slice(0, 2).toUpperCase(),
      color:       AVATAR_COLORS[i % AVATAR_COLORS.length],
    })),
  };
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return Response.json({ connected: false, events: [] });
  }

  const url       = new URL(request.url);
  const wsParam   = url.searchParams.get('weekStart');
  const weekStart = wsParam ? parseInt(wsParam) : Date.now();
  const timeMin   = new Date(weekStart).toISOString();
  const timeMax   = new Date(weekStart + 7 * 86_400_000).toISOString();

  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  try {
    // Fetch all writable/readable calendars so secondary calendars are included
    const listRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader',
      { headers: authHeaders },
    );

    if (!listRes.ok) {
      if (listRes.status === 401) {
        const cookieStore = await cookies();
        cookieStore.delete('gcal_token');
        return Response.json({ connected: false, events: [] });
      }
      console.error('[google-calendar GET] calendarList', listRes.status, await listRes.text());
      return Response.json({ error: 'Google Calendar API error' }, { status: 502 });
    }

    const listData = (await listRes.json()) as { items?: Array<{ id: string }> };
    const calendarIds = (listData.items ?? []).map(c => c.id);
    if (calendarIds.length === 0) calendarIds.push('primary');

    const eventsQuery =
      `?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}` +
      `&singleEvents=true&orderBy=startTime&maxResults=250`;

    const allFetches = calendarIds.map(id =>
      fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events${eventsQuery}`,
        { headers: authHeaders },
      ).then(r => r.ok ? r.json() as Promise<{ items?: GCalItem[] }> : Promise.resolve({ items: [] })),
    );

    const results = await Promise.all(allFetches);
    const seen = new Set<string>();
    const events: CalendarEvent[] = results
      .flatMap(d => d.items ?? [])
      .map(normaliseItem)
      .filter((e): e is CalendarEvent => {
        if (!e || seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });

    return Response.json({ connected: true, events });
  } catch (err) {
    console.error('[google-calendar GET]', err);
    return Response.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(request: Request) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ connected: false }, { status: 401 });
  }

  const body = (await request.json()) as {
    eventId:    string;
    startUnix:  number;
    endUnix:    number;
  };

  try {
    const patchRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${body.eventId}`,
      {
        method:  'PATCH',
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: { dateTime: new Date(body.startUnix).toISOString() },
          end:   { dateTime: new Date(body.endUnix).toISOString() },
        }),
      },
    );

    if (!patchRes.ok) throw new Error(`PATCH ${patchRes.status}`);
    return Response.json({ ok: true });
  } catch (err) {
    console.error('[google-calendar PATCH]', err);
    return Response.json({ error: 'Failed to update event' }, { status: 500 });
  }
}
