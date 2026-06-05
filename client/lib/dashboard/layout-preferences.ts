import { CALENDAR_VIEWPORT_HEIGHT } from "@/lib/dashboard/calendar-layout";

const STORAGE_KEY = "dashboard-layout-preferences";
const LEGACY_SIDEBAR_KEY = "dashboard-sidebar-collapsed";

export const CALENDAR_VIEWPORT_MIN = 280;
export const CALENDAR_VIEWPORT_MAX = 900;

export const WIDGETS_LEFT_RATIO_MIN = 0.25;
export const WIDGETS_LEFT_RATIO_MAX = 0.75;
export const WIDGETS_LEFT_RATIO_DEFAULT = 0.5;

export type DashboardLayoutPreferences = {
  sidebarCollapsed: boolean;
  calendarViewportHeight: number;
  widgetsLeftRatio: number;
};

const DEFAULT_PREFERENCES: DashboardLayoutPreferences = {
  sidebarCollapsed: false,
  calendarViewportHeight: CALENDAR_VIEWPORT_HEIGHT,
  widgetsLeftRatio: WIDGETS_LEFT_RATIO_DEFAULT,
};

function clampWidgetsLeftRatio(ratio: number) {
  return Math.min(
    WIDGETS_LEFT_RATIO_MAX,
    Math.max(WIDGETS_LEFT_RATIO_MIN, ratio),
  );
}

function clampCalendarHeight(height: number) {
  return Math.min(
    CALENDAR_VIEWPORT_MAX,
    Math.max(CALENDAR_VIEWPORT_MIN, Math.round(height)),
  );
}

export function readLayoutPreferences(): DashboardLayoutPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DashboardLayoutPreferences>;
      return {
        sidebarCollapsed:
          parsed.sidebarCollapsed ?? DEFAULT_PREFERENCES.sidebarCollapsed,
        calendarViewportHeight: clampCalendarHeight(
          parsed.calendarViewportHeight ??
            DEFAULT_PREFERENCES.calendarViewportHeight,
        ),
        widgetsLeftRatio: clampWidgetsLeftRatio(
          parsed.widgetsLeftRatio ?? DEFAULT_PREFERENCES.widgetsLeftRatio,
        ),
      };
    }

    const legacySidebar = window.localStorage.getItem(LEGACY_SIDEBAR_KEY);
    if (legacySidebar === "true") {
      return { ...DEFAULT_PREFERENCES, sidebarCollapsed: true };
    }
  } catch {
    // fall through to defaults
  }

  return DEFAULT_PREFERENCES;
}

export function saveLayoutPreferences(
  patch: Partial<DashboardLayoutPreferences>,
) {
  if (typeof window === "undefined") return;

  const current = readLayoutPreferences();
  const next: DashboardLayoutPreferences = {
    sidebarCollapsed: patch.sidebarCollapsed ?? current.sidebarCollapsed,
    calendarViewportHeight: clampCalendarHeight(
      patch.calendarViewportHeight ?? current.calendarViewportHeight,
    ),
    widgetsLeftRatio: clampWidgetsLeftRatio(
      patch.widgetsLeftRatio ?? current.widgetsLeftRatio,
    ),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.localStorage.removeItem(LEGACY_SIDEBAR_KEY);
}

