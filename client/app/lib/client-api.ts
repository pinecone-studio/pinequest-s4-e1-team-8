import axios from "axios";

const serverBaseURL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://server-preset.danny-otgontsetseg.workers.dev";

/** For Client Components / the browser (`withCredentials` for cookies). */
export const clientApi = axios.create({
  // Same-origin in the browser so Next.js rewrites proxy to the backend.
  baseURL: typeof window !== "undefined" ? "" : serverBaseURL,
  withCredentials: true,
  timeout: 15_000,
});

/** Backend task API (proxied via /api/backend/tasks to avoid clashing with /tasks page). */
export const TASKS_API_BASE = "/api/backend/tasks";
