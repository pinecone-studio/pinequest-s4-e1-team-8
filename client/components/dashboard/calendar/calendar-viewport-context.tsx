"use client";

import { CALENDAR_VIEWPORT_HEIGHT } from "@/lib/dashboard/calendar-layout";
import {
  CALENDAR_VIEWPORT_MAX,
  CALENDAR_VIEWPORT_MIN,
  readLayoutPreferences,
  saveLayoutPreferences,
} from "@/lib/dashboard/layout-preferences";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type CalendarViewportContextValue = {
  viewportHeight: number;
  hydrated: boolean;
  setViewportHeight: (height: number) => void;
};

const CalendarViewportContext =
  createContext<CalendarViewportContextValue | null>(null);

function clampHeight(height: number) {
  return Math.min(
    CALENDAR_VIEWPORT_MAX,
    Math.max(CALENDAR_VIEWPORT_MIN, Math.round(height)),
  );
}

export function CalendarViewportProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [viewportHeight, setViewportHeightState] = useState(
    CALENDAR_VIEWPORT_HEIGHT,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const prefs = readLayoutPreferences();
    setViewportHeightState(prefs.calendarViewportHeight);
    setHydrated(true);
  }, []);

  const setViewportHeight = useCallback((height: number) => {
    const next = clampHeight(height);
    setViewportHeightState(next);
    saveLayoutPreferences({ calendarViewportHeight: next });
  }, []);

  const value = useMemo(
    () => ({
      viewportHeight: hydrated ? viewportHeight : CALENDAR_VIEWPORT_HEIGHT,
      hydrated,
      setViewportHeight,
    }),
    [hydrated, setViewportHeight, viewportHeight],
  );

  return (
    <CalendarViewportContext.Provider value={value}>
      {children}
    </CalendarViewportContext.Provider>
  );
}

export function useCalendarViewport() {
  const ctx = useContext(CalendarViewportContext);
  if (!ctx) {
    throw new Error(
      "useCalendarViewport must be used within CalendarViewportProvider",
    );
  }
  return ctx;
}
