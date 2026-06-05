export type CalendarEventType = 'meeting' | 'task' | 'all-day';

export interface CalendarAttendee {
  email: string;
  displayName?: string;
  initials: string;
  color: string;
}

export interface GoogleDocsLink {
  id: string;
  title: string;
  url: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  /** UTC milliseconds */
  startUnix: number;
  /** UTC milliseconds */
  endUnix: number;
  color: EventColor;

  // Meeting fields
  meetUrl?: string;
  attendees?: CalendarAttendee[];

  // Task fields
  done?: boolean;
  checklistItems?: ChecklistItem[];

  // Docs links (shown in expanded state)
  docsLinks?: GoogleDocsLink[];

  // Populated by layoutEventsForDay — do not set manually
  _layout?: EventLayout;
}

export interface EventLayout {
  topPx: number;
  heightPx: number;
  leftPct: number;
  widthPct: number;
}

export type EventColor = 'gold' | 'blue' | 'violet' | 'pink' | 'emerald' | 'cyan';

export const EVENT_COLORS: Record<
  EventColor,
  { bg: string; text: string; glow: string; accent: string }
> = {
  gold:    { bg: '#f5d565', text: '#3a2f0a', glow: 'rgba(245,213,101,0.30)', accent: '#e8bc20' },
  blue:    { bg: '#2563eb', text: '#ffffff', glow: 'rgba(37,99,235,0.38)',   accent: '#3b82f6' },
  violet:  { bg: '#6d28d9', text: '#ffffff', glow: 'rgba(109,40,217,0.38)',  accent: '#8b5cf6' },
  pink:    { bg: '#be185d', text: '#ffffff', glow: 'rgba(190,24,93,0.35)',   accent: '#ec4899' },
  emerald: { bg: '#047857', text: '#ffffff', glow: 'rgba(4,120,87,0.35)',    accent: '#34d399' },
  cyan:    { bg: '#0e7490', text: '#ffffff', glow: 'rgba(14,116,144,0.35)',  accent: '#22d3ee' },
};
