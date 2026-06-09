/**
 * Deploy brisk-client to Cloudflare with production API URLs baked into the build.
 * Reads Clerk/OAuth secrets from client/.env.local (not committed).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROD_API_URL = "https://server-preset.danny-otgontsetseg.workers.dev";

function loadEnvFile(relativePath) {
  const filePath = path.join(clientRoot, relativePath);
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split("\n")) {
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

loadEnvFile(".env.local");

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

const result = spawnSync("bun", ["run", "deploy"], {
  cwd: clientRoot,
  env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
