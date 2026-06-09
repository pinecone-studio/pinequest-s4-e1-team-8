import type { NextConfig } from "next";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(clientRoot, "..");
const requireFromClient = createRequire(path.join(clientRoot, "package.json"));

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
const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://server-preset.danny-otgontsetseg.workers.dev";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
    resolveAlias: {
      tailwindcss: path.join(clientRoot, "node_modules/tailwindcss"),
      "tw-animate-css": path.join(clientRoot, "node_modules/tw-animate-css"),
      shadcn: path.join(clientRoot, "node_modules/shadcn"),
    },
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
    ];
  },
};

export default nextConfig;

requireFromClient("@opennextjs/cloudflare").initOpenNextCloudflareForDev();
