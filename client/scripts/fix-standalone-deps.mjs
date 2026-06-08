import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const standaloneRoot = path.join(clientRoot, ".next/standalone");
const nestedClientRoot = path.join(standaloneRoot, "client");
const standaloneNodeModules = path.join(standaloneRoot, "node_modules");
const standaloneNext = path.join(standaloneNodeModules, "next");
const sourceNext = path.join(clientRoot, "node_modules/next");

if (!existsSync(sourceNext)) {
  throw new Error(`Missing Next.js package at ${sourceNext}`);
}

if (!existsSync(standaloneRoot)) {
  throw new Error(`Missing standalone output at ${standaloneRoot}`);
}

// Monorepo builds nest the app under standalone/client — flatten for OpenNext.
const nestedNextDir = path.join(nestedClientRoot, ".next");
const flatNextDir = path.join(standaloneRoot, ".next");
if (existsSync(nestedNextDir)) {
  rmSync(flatNextDir, { recursive: true, force: true });
  cpSync(nestedNextDir, flatNextDir, { recursive: true });
}

const nestedServer = path.join(nestedClientRoot, "server.js");
const flatServer = path.join(standaloneRoot, "server.js");
if (existsSync(nestedServer) && !existsSync(flatServer)) {
  cpSync(nestedServer, flatServer);
}

mkdirSync(standaloneNodeModules, { recursive: true });
rmSync(standaloneNext, { recursive: true, force: true });
cpSync(sourceNext, standaloneNext, { recursive: true });

console.log("Prepared standalone output for OpenNext.");
