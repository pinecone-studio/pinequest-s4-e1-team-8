import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const standaloneNext = path.join(
  clientRoot,
  ".next/standalone/node_modules/next",
);
const sourceNext = path.join(clientRoot, "node_modules/next");

if (!existsSync(sourceNext)) {
  throw new Error(`Missing Next.js package at ${sourceNext}`);
}

if (!existsSync(standaloneNext)) {
  throw new Error(`Missing standalone Next.js path at ${standaloneNext}`);
}

rmSync(standaloneNext, { recursive: true, force: true });
cpSync(sourceNext, standaloneNext, { recursive: true });

console.log("Copied full Next.js package into standalone output.");
