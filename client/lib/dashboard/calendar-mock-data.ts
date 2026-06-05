import type { CalendarEvent } from './calendar-types';
import { getWeekStart, getTodayMidnight } from './calendar-engine';

// Build a UTC-ms timestamp for a specific local hour on a given day
function localHour(dayMidnightUnix: number, hour: number, minute = 0): number {
  return dayMidnightUnix + (hour * 60 + minute) * 60_000;
}

function makeEvent(
  dayOffset: number, // 0 = Mon … 6 = Sun
  startH: number,
  startM: number,
  endH: number,
  endM: number,
  overrides: Omit<CalendarEvent, 'startUnix' | 'endUnix'>,
  weekStartUnix: number,
): CalendarEvent {
  const dayUnix  = weekStartUnix + dayOffset * 86_400_000;
  const startUnix = localHour(dayUnix, startH, startM);
  const endUnix   = localHour(dayUnix, endH,   endM);
  return { startUnix, endUnix, ...overrides };
}

export function getMockEvents(weekStartUnix?: number): CalendarEvent[] {
  const start = weekStartUnix ?? getWeekStart(getTodayMidnight());

  return [
    // ── Monday ────────────────────────────────────────────────────────────────
    makeEvent(0, 9, 0, 10, 30, {
      id: 'ev-1', type: 'meeting', color: 'gold',
      title: 'Design System Team Sync',
      meetUrl: 'https://meet.google.com/abc-xyz-123',
      attendees: [
        { email: 'a@co', displayName: 'Alice',  initials: 'AL', color: '#8b5cf6' },
        { email: 'b@co', displayName: 'Bob',    initials: 'BO', color: '#3b82f6' },
        { email: 'c@co', displayName: 'Cara',   initials: 'CA', color: '#ec4899' },
      ],
    }, start),

    makeEvent(0, 14, 0, 16, 0, {
      id: 'ev-2', type: 'task', color: 'pink',
      title: 'Redesign Edu Web',
      checklistItems: [
        { id: 'c1', label: 'Research',   done: true  },
        { id: 'c2', label: 'Wireframe',  done: true  },
        { id: 'c3', label: 'UI Design',  done: true  },
        { id: 'c4', label: 'Prototype',  done: false },
        { id: 'c5', label: 'A/B Test',   done: false },
      ],
    }, start),

    // ── Tuesday ───────────────────────────────────────────────────────────────
    makeEvent(1, 9, 0, 10, 0, {
      id: 'ev-3', type: 'meeting', color: 'blue',
      title: 'Sprint Planning',
      meetUrl: 'https://meet.google.com/spr-pln',
      attendees: [
        { email: 'pm@co', displayName: 'PM Lead', initials: 'PM', color: '#f5d565' },
        { email: 'em@co', displayName: 'Eng Mgr', initials: 'EM', color: '#34d399' },
      ],
    }, start),

    makeEvent(1, 10, 15, 13, 45, {
      id: 'ev-4', type: 'task', color: 'violet',
      title: '3D Design Orzano Cotton',
      docsLinks: [
        { id: 'd1', title: 'Final Edit.CAD',     url: '#' },
        { id: 'd2', title: 'Brand Guidelines',   url: '#' },
      ],
      attendees: [
        { email: 'd@co', displayName: 'Diana', initials: 'DI', color: '#f5d565' },
        { email: 'e@co', displayName: 'Erik',  initials: 'ER', color: '#34d399' },
      ],
    }, start),

    // ── Wednesday ─────────────────────────────────────────────────────────────
    makeEvent(2, 9, 0, 11, 0, {
      id: 'ev-5', type: 'task', color: 'emerald',
      title: 'Wireframe SmartHome App',
      docsLinks: [{ id: 'd3', title: 'Project Brief.doc', url: '#' }],
      attendees: [
        { email: 'mr@co', displayName: 'Monica Rose', initials: 'MR', color: '#f5d565' },
      ],
    }, start),

    makeEvent(2, 11, 30, 12, 30, {
      id: 'ev-6', type: 'meeting', color: 'cyan',
      title: 'Product Review',
      meetUrl: 'https://meet.google.com/prd-rev',
      attendees: [
        { email: 'mg@co', displayName: 'Manager', initials: 'MG', color: '#8b5cf6' },
        { email: 'dv@co', displayName: 'Dev',     initials: 'DV', color: '#3b82f6' },
      ],
    }, start),

    // Wed: overlapping pair to showcase the tiling algorithm
    makeEvent(2, 14, 0, 16, 30, {
      id: 'ev-7', type: 'task', color: 'violet',
      title: 'UX Research Session',
      checklistItems: [
        { id: 'r1', label: 'User interviews',  done: true  },
        { id: 'r2', label: 'Affinity mapping', done: false },
        { id: 'r3', label: 'Report synthesis', done: false },
      ],
    }, start),

    makeEvent(2, 14, 30, 16, 0, {
      id: 'ev-8', type: 'meeting', color: 'blue',
      title: 'Component Audit',
      meetUrl: 'https://meet.google.com/cmp-aud',
      attendees: [
        { email: 'x@co', displayName: 'Xavier', initials: 'XA', color: '#ec4899' },
      ],
    }, start),

    // ── Thursday ──────────────────────────────────────────────────────────────
    makeEvent(3, 10, 0, 11, 0, {
      id: 'ev-9', type: 'meeting', color: 'blue',
      title: 'Engineering Standup',
      meetUrl: 'https://meet.google.com/eng-std',
      attendees: [
        { email: 'e1@co', initials: 'E1', color: '#8b5cf6' },
        { email: 'e2@co', initials: 'E2', color: '#ec4899' },
        { email: 'e3@co', initials: 'E3', color: '#f5d565' },
      ],
    }, start),

    makeEvent(3, 13, 0, 14, 30, {
      id: 'ev-10', type: 'task', color: 'gold',
      title: 'Stakeholder Presentation Prep',
      docsLinks: [
        { id: 'd4', title: 'Deck v3.pptx', url: '#' },
        { id: 'd5', title: 'Talking Points.doc', url: '#' },
      ],
    }, start),

    // ── Friday ────────────────────────────────────────────────────────────────
    makeEvent(4, 9, 30, 10, 15, {
      id: 'ev-11', type: 'meeting', color: 'gold',
      title: 'Friday Retrospective',
      meetUrl: 'https://meet.google.com/fri-ret',
      attendees: [
        { email: 'tm@co', displayName: 'Team', initials: 'TM', color: '#34d399' },
      ],
    }, start),

    makeEvent(4, 11, 0, 13, 0, {
      id: 'ev-12', type: 'task', color: 'emerald',
      title: 'Feature Documentation',
      docsLinks: [
        { id: 'd6', title: 'Feature Spec v2.doc', url: '#' },
        { id: 'd7', title: 'API Reference.doc',   url: '#' },
      ],
    }, start),

    // ── All-day spanning Mon → Fri ────────────────────────────────────────────
    {
      id: 'ev-allday-1', type: 'all-day', color: 'cyan',
      title: 'Product Launch Sprint',
      startUnix: start,
      endUnix:   start + 5 * 86_400_000,
    },
  ];
}
