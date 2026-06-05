import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = path.dirname(fileURLToPath(import.meta.url));
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

const nextConfig: NextConfig = {
  turbopack: {
    root: clientRoot,
    resolveAlias: {
      tailwindcss: path.join(clientRoot, "node_modules/tailwindcss"),
      "tw-animate-css": path.join(clientRoot, "node_modules/tw-animate-css"),
      shadcn: path.join(clientRoot, "node_modules/shadcn"),
    },
  },
  async rewrites() {
    return [
      { source: "/analytics/:path*", destination: `${apiUrl}/analytics/:path*` },
      { source: "/tasks/:path*", destination: `${apiUrl}/tasks/:path*` },
      { source: "/integrations/:path*", destination: `${apiUrl}/integrations/:path*` },
      { source: "/users/:path*", destination: `${apiUrl}/users/:path*` },
    ];
  },
};

export default nextConfig;
