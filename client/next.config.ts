import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

const nextConfig: NextConfig = {
  turbopack: {
    root: clientRoot,
    resolveAlias: {
      tailwindcss: path.join(clientRoot, "node_modules/tailwindcss"),
      "tw-animate-css": path.join(clientRoot, "node_modules/tw-animate-css"),
      shadcn: path.join(clientRoot, "node_modules/shadcn"),
    },
  },
};

export default nextConfig;
