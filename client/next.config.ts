import type { NextConfig } from "next";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = path.dirname(fileURLToPath(import.meta.url));
const requireFromClient = createRequire(path.join(clientRoot, "package.json"));

// Use .env.local for OpenNext/Wrangler local dev — client has no .dev.vars file.
process.env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV ??= "true";

// Monorepo turbopack root can skip client/.env.local — load it for API routes.
for (const envFile of [".env.local", ".env"]) {
  const envPath = path.join(clientRoot, envFile);
  if (!existsSync(envPath)) continue;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, "$2");
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
const isDev = process.env.NODE_ENV !== "production";
const apiUrl = isDev
  ? (process.env.LOCAL_API_URL ?? "http://localhost:8787")
  : (process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8787");

const nextConfig: NextConfig = {
  output: "standalone",
  // Both must point at the client app (Next 16 requires them to match). The
  // monorepo root has no node_modules, so rooting there breaks resolution of
  // tailwindcss, next, etc. — they all live in client/node_modules.
  outputFileTracingRoot: clientRoot,
  turbopack: {
    root: clientRoot,
    resolveAlias: {
      tailwindcss: path.join(clientRoot, "node_modules/tailwindcss"),
      "tw-animate-css": path.join(clientRoot, "node_modules/tw-animate-css"),
      shadcn: path.join(clientRoot, "node_modules/shadcn"),
    },
  },
  async redirects() {
    return [{ source: "/", destination: "/login", permanent: false }];
  },
  async rewrites() {
    return [
      { source: "/analytics/:path*", destination: `${apiUrl}/analytics/:path*` },
      // Must not use /tasks — conflicts with the App Router page at app/tasks/page.tsx.
      { source: "/api/backend/tasks", destination: `${apiUrl}/tasks` },
      { source: "/api/backend/tasks/:path*", destination: `${apiUrl}/tasks/:path*` },
      { source: "/integrations/:path*", destination: `${apiUrl}/integrations/:path*` },
      { source: "/users/:path*", destination: `${apiUrl}/users/:path*` },
      { source: "/api/backend/projects", destination: `${apiUrl}/projects` },
      { source: "/api/backend/projects/:path*", destination: `${apiUrl}/projects/:path*` },
      {
        source: "/api/backend/agent/stream/:path*",
        destination: `${apiUrl}/api/agent/stream/:path*`,
      },
      {
        source: "/api/backend/onboarding/:path*",
        destination: `${apiUrl}/api/onboarding/:path*`,
      },
    ];
  },
};

export default nextConfig;

requireFromClient("@opennextjs/cloudflare").initOpenNextCloudflareForDev();
