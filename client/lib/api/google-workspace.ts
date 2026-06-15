import { clientApi } from "@/app/lib/client-api";
import type { AgendaEvent, GoogleAgendaResponse } from "@/lib/home/agenda-types";
import axios from "axios";

export async function getGoogleWorkspaceStatus() {
  const { data } = await clientApi.get<{ connected: boolean }>(
    "/api/backend/google/status",
  );
  return data;
}

export async function getGoogleCalendarAgenda(bounds?: {
  timeMin: string;
  timeMax: string;
  timeZone: string;
}) {
  const { data } = await clientApi.get<GoogleAgendaResponse>(
    "/api/backend/google/calendar/agenda",
    {
      params: bounds,
    },
  );
  return data;
}

export function formatGoogleWorkspaceError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error;
    if (typeof message === "string" && message.trim()) {
      return message;
    }

    if (error.response?.status === 401) {
      return "Sign in to connect Google Workspace.";
    }
  }

  return "Could not load Google Calendar. Try again.";
}

export async function disconnectGoogleWorkspace() {
  const { data } = await clientApi.delete<{ ok: boolean }>(
    "/api/backend/google/disconnect",
  );
  return data;
}

export function startGoogleWorkspaceConnect(returnTo = "/home") {
  const params = new URLSearchParams({ returnTo });
  window.location.href = `/api/auth/google?${params.toString()}`;
}

export type { AgendaEvent };
