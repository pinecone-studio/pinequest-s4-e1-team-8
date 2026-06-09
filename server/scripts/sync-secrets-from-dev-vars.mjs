/**
 * Push Worker secrets from server/.dev.vars to the remote Cloudflare Worker.
 * Usage: node scripts/sync-secrets-from-dev-vars.mjs [SECRET_NAME ...]
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const devVarsPath = path.join(serverRoot, ".dev.vars");

const DEFAULT_SECRETS = [
  "GEMINI_API_KEY",
  "GROQ_API_KEY",
  "CLERK_SECRET_KEY",
];

function parseDevVars(filePath) {
  const values = new Map();
  if (!existsSync(filePath)) {
    throw new Error(`Missing ${filePath}. Copy from .dev.vars.example first.`);
  }

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
    if (value) {
      values.set(key, value);
    }
  }

  return values;
}

const requested = process.argv.slice(2);
const secretNames = requested.length > 0 ? requested : DEFAULT_SECRETS;
const devVars = parseDevVars(devVarsPath);

for (const name of secretNames) {
  const value = devVars.get(name);
  if (!value) {
    console.error(`Skip ${name}: not set in .dev.vars`);
    continue;
  }

  console.log(`Updating remote secret ${name}...`);
  const result = spawnSync("bunx", ["wrangler", "secret", "put", name], {
    cwd: serverRoot,
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("Remote secrets updated.");
