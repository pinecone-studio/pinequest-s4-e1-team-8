/** Same-origin proxy in the browser avoids CORS when Next dev uses another port. */
export function getAgentStreamRunUrl() {
  if (typeof window !== "undefined") {
    return "/api/backend/agent/stream/run";
  }

  const base =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_SERVER_URL ??
    "http://localhost:8787";

  return `${base.replace(/\/$/, "")}/api/agent/stream/run`;
}
