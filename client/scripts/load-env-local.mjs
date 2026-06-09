import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function loadClientEnvLocal() {
  for (const relativePath of [".env.local", ".env"]) {
    const filePath = path.join(clientRoot, relativePath);
    if (!existsSync(filePath)) continue;

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
}
