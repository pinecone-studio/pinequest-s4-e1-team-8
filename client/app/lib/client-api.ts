import axios from "axios";

const serverBaseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

/** For Client Components / the browser (`withCredentials` for cookies). */
export const clientApi = axios.create({
  // Same-origin in the browser so Next.js rewrites proxy to the backend.
  baseURL: typeof window !== "undefined" ? "" : serverBaseURL,
  withCredentials: true,
});
