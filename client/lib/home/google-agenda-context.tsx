"use client";

import {
  formatGoogleWorkspaceError,
  getGoogleCalendarAgenda,
} from "@/lib/api/google-workspace";
import { useClientApiAuth } from "@/lib/api/auth-interceptor";
import type { AgendaEvent } from "@/lib/home/agenda-types";
import {
  enrichAgendaEvent,
  filterUpcomingEvents,
  getEventsForDate,
  getUpcomingWeekBounds,
} from "@/lib/home/google-agenda-utils";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type GoogleAgendaContextValue = {
  events: AgendaEvent[];
  connected: boolean | null;
  isLoading: boolean;
  error: string;
  reload: () => Promise<void>;
  getEventsForDate: (date: Date) => AgendaEvent[];
};

const GoogleAgendaContext = createContext<GoogleAgendaContextValue | null>(null);

export function GoogleAgendaProvider({ children }: { children: ReactNode }) {
  useClientApiAuth();

  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAgenda = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const bounds = getUpcomingWeekBounds();
      const response = await getGoogleCalendarAgenda(bounds);
      setConnected(response.connected);
      setEvents(
        filterUpcomingEvents(
          response.events.map((event) => enrichAgendaEvent(event)),
        ),
      );
    } catch (caughtError) {
      setError(formatGoogleWorkspaceError(caughtError));
      setConnected(false);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAgenda();
  }, [loadAgenda]);

  const getEventsForDay = useCallback(
    (date: Date) => getEventsForDate(events, date),
    [events],
  );

  const value = useMemo(
    () => ({
      events,
      connected,
      isLoading,
      error,
      reload: loadAgenda,
      getEventsForDate: getEventsForDay,
    }),
    [connected, error, events, getEventsForDay, isLoading, loadAgenda],
  );

  return (
    <GoogleAgendaContext.Provider value={value}>{children}</GoogleAgendaContext.Provider>
  );
}

export function useGoogleAgenda() {
  const context = useContext(GoogleAgendaContext);
  if (!context) {
    throw new Error("useGoogleAgenda must be used within GoogleAgendaProvider");
  }
  return context;
}
