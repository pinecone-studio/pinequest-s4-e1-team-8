/**
 * GET  /api/google-calendar?weekStart=<unix-ms>
 * PATCH /api/google-calendar  — update title / times / add Meet
 * POST  /api/google-calendar  — create new event (optionally with Meet)
 * DELETE /api/google-calendar — delete event
 */

import { cookies } from 'next/headers';
import type { CalendarEvent, CalendarEventType, EventColor } from '@/lib/dashboard/calendar-types';

// Prevent this route from being statically cached at the Next.js layer
export const dynamic = 'force-dynamic';

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

  if (stored.expiry_ms - Date.now() > 60_000) return stored.access_token;

  if (!stored.refresh_token) return null;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    cache:   'no-store',
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
  status?: string;
  start: { dateTime?: string; date?: string };
  end:   { dateTime?: string; date?: string };
  conferenceData?: { entryPoints?: Array<{ entryPointType: string; uri: string }> };
  hangoutLink?: string;
  attendees?: Array<{ email: string; displayName?: string }>;
  colorId?: string;
}

function normaliseItem(item: GCalItem): CalendarEvent | null {
  // Skip cancelled events
  if (item.status === 'cancelled') return null;

  const isAllDay  = Boolean(item.start.date && !item.start.dateTime);
  const startUnix = isAllDay
    ? new Date(item.start.date!).getTime()
    : new Date(item.start.dateTime!).getTime();
  const endUnix = isAllDay
    ? new Date(item.end.date!).getTime()
    : new Date(item.end.dateTime!).getTime();

  if (isNaN(startUnix) || isNaN(endUnix)) return null;

  const meetEntry = item.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video');
  const meetUrl   = meetEntry?.uri ?? item.hangoutLink;
  const type: CalendarEventType = isAllDay ? 'all-day' : meetUrl ? 'meeting' : 'task';
  const color: EventColor = COLOR_MAP[item.colorId ?? ''] ?? (meetUrl ? 'blue' : 'violet');

  return {
    id:      item.id,
    type,
    title:   item.summary ?? '(No title)',
    startUnix,
    endUnix,
    color,
    meetUrl,
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
    // Fetch all calendars in the user's list
    const listRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      { headers: authHeaders, cache: 'no-store' },
    );

    let calendarIds: string[];

    if (!listRes.ok) {
      if (listRes.status === 401) {
        const cookieStore = await cookies();
        cookieStore.delete('gcal_token');
        return Response.json({ connected: false, events: [] });
      }
      // calendarList failed — fall back to primary only
      console.error('[gcal GET] calendarList failed:', listRes.status);
      calendarIds = ['primary'];
    } else {
      const listData = (await listRes.json()) as { items?: Array<{ id: string; accessRole?: string }> };
      // Only include calendars where we can read events (reader or above)
      const readable = (listData.items ?? []).filter(c =>
        !c.accessRole || ['reader','writer','owner','freeBusyReader'].includes(c.accessRole),
      );
      calendarIds = readable.length > 0 ? readable.map(c => c.id) : ['primary'];
      console.log(`[gcal GET] fetching ${calendarIds.length} calendar(s):`, calendarIds);
    }

    const eventsQuery =
      `?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}` +
      `&singleEvents=true&orderBy=startTime&maxResults=250`;

    const allFetches = calendarIds.map(id =>
      fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events${eventsQuery}`,
        { headers: authHeaders, cache: 'no-store' },
      )
        .then(r => {
          if (!r.ok) {
            console.error(`[gcal GET] calendar "${id}" events failed: ${r.status}`);
            return { items: [] as GCalItem[] };
          }
          return r.json() as Promise<{ items?: GCalItem[] }>;
        })
        .catch(err => {
          console.error(`[gcal GET] calendar "${id}" network error:`, err);
          return { items: [] as GCalItem[] };
        }),
    );

    const results = await Promise.all(allFetches);

    const seen = new Set<string>();
    const events: CalendarEvent[] = results
      .flatMap((d, i) => {
        const items = d.items ?? [];
        console.log(`[gcal GET] calendar[${i}] "${calendarIds[i]}" → ${items.length} item(s)`);
        return items;
      })
      .map(normaliseItem)
      .filter((e): e is CalendarEvent => {
        if (!e || seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });

    console.log(`[gcal GET] total events returned: ${events.length}`);
    return Response.json({ connected: true, events });
  } catch (err) {
    console.error('[google-calendar GET]', err);
    return Response.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(request: Request) {
  const accessToken = await getAccessToken();
  if (!accessToken) return Response.json({ connected: false }, { status: 401 });

  const body = (await request.json()) as {
    eventId:    string;
    startUnix?: number;
    endUnix?:   number;
    title?:     string;
    addMeet?:   boolean;
  };

  const gcalBody: Record<string, unknown> = {};
  if (body.title     !== undefined) gcalBody.summary = body.title;
  if (body.startUnix !== undefined) gcalBody.start   = { dateTime: new Date(body.startUnix).toISOString() };
  if (body.endUnix   !== undefined) gcalBody.end     = { dateTime: new Date(body.endUnix).toISOString() };
  if (body.addMeet) {
    gcalBody.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  const qs = body.addMeet ? '?conferenceDataVersion=1' : '';

  try {
    const patchRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${body.eventId}${qs}`,
      {
        method:  'PATCH',
        cache:   'no-store',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(gcalBody),
      },
    );
    if (!patchRes.ok) throw new Error(`PATCH ${patchRes.status}`);
    const updated = (await patchRes.json()) as GCalItem;
    return Response.json({ ok: true, event: normaliseItem(updated) });
  } catch (err) {
    console.error('[google-calendar PATCH]', err);
    return Response.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const accessToken = await getAccessToken();
  if (!accessToken) return Response.json({ connected: false }, { status: 401 });

  const body = (await request.json()) as {
    title:     string;
    startUnix: number;
    endUnix:   number;
    addMeet?:  boolean;
  };

  const gcalBody: Record<string, unknown> = {
    summary: body.title,
    start:   { dateTime: new Date(body.startUnix).toISOString() },
    end:     { dateTime: new Date(body.endUnix).toISOString() },
  };
  if (body.addMeet) {
    gcalBody.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  const qs = body.addMeet ? '?conferenceDataVersion=1' : '';

  try {
    const createRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events${qs}`,
      {
        method:  'POST',
        cache:   'no-store',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(gcalBody),
      },
    );
    if (!createRes.ok) throw new Error(`POST ${createRes.status}`);
    const created = (await createRes.json()) as GCalItem;
    return Response.json({ ok: true, event: normaliseItem(created) });
  } catch (err) {
    console.error('[google-calendar POST]', err);
    return Response.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(request: Request) {
  const accessToken = await getAccessToken();
  if (!accessToken) return Response.json({ connected: false }, { status: 401 });

  const body = (await request.json()) as { eventId: string };

  try {
    const deleteRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${body.eventId}`,
      {
        method:  'DELETE',
        cache:   'no-store',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!deleteRes.ok && deleteRes.status !== 204) throw new Error(`DELETE ${deleteRes.status}`);
    return Response.json({ ok: true });
  } catch (err) {
    console.error('[google-calendar DELETE]', err);
    return Response.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
