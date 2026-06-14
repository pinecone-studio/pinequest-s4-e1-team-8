// Frontend-facing Next.js route paths (proxied to the Worker).
export const RECORDING_ENDPOINTS = {
  upload: "/recordings/api/upload",
  list: "/recordings/api",
  recording: (id: string) => `/recordings/api/${encodeURIComponent(id)}`,
  audio: (id: string) => `/recordings/api/${encodeURIComponent(id)}/audio`,
} as const;

// Backend (Cloudflare Worker / Hono) paths the proxy forwards to.
export const BACKEND_RECORDING_ENDPOINTS = {
  upload: "/api/recordings/upload",
  list: "/api/recordings",
  recording: (id: string) => `/api/recordings/${encodeURIComponent(id)}`,
  audio: (id: string) => `/api/recordings/${encodeURIComponent(id)}/audio`,
} as const;
