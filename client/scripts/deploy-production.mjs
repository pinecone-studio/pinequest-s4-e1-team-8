/**
 * Deploy brisk-client to Cloudflare with production API URLs baked into the build.
 * Reads secrets from client/.env.local (not committed).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadClientEnvLocal } from "./load-env-local.mjs";

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROD_API_URL = "https://server-preset.danny-otgontsetseg.workers.dev";

loadClientEnvLocal();

const env = {
  ...process.env,
  NEXTJS_ENV: "production",
  API_URL: PROD_API_URL,
  NEXT_PUBLIC_API_URL: PROD_API_URL,
};

const required = ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"];
const missing = required.filter((key) => !env[key]?.trim());
if (missing.length > 0) {
  console.error(
    `Missing required env for deploy: ${missing.join(", ")}. Set them in client/.env.local.`,
  );
  process.exit(1);
}

console.log(`Deploying brisk-client with API_URL=${PROD_API_URL}`);

const result = spawnSync(
  "bun run build:cf && bunx opennextjs-cloudflare build --skipNextBuild && node scripts/patch-handler-middleware.mjs && bunx opennextjs-cloudflare deploy",
  {
    cwd: clientRoot,
    env,
    stdio: "inherit",
    shell: true,
  },
);

process.exit(result.status ?? 1);
