import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const handlerPath = path.join(
  clientRoot,
  ".open-next/server-functions/default/handler.mjs",
);
const manifestPath = path.join(
  clientRoot,
  ".open-next/server-functions/default/.next/server/middleware-manifest.json",
);

const manifest = readFileSync(manifestPath, "utf8");
let handler = readFileSync(handlerPath, "utf8");

// Next emits one of two forms depending on version:
//   getMiddlewareManifest(){return null}                                  (current)
//   getMiddlewareManifest(){return this.minimalMode?...:require(...)}     (older)
// Either way, inline the real manifest so middleware (Clerk auth) resolves
// in the bundled Cloudflare worker.
const pattern =
  /getMiddlewareManifest\(\)\{return (?:null|this\.minimalMode\?[^:]+:require\(this\.middlewareManifestPath\))\}/;

if (!pattern.test(handler)) {
  throw new Error("Could not find getMiddlewareManifest() patch target in handler.mjs");
}

handler = handler.replace(
  pattern,
  `getMiddlewareManifest(){return ${manifest}}`,
);

writeFileSync(handlerPath, handler);
console.log("Patched middleware manifest into OpenNext handler.");
