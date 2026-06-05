import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import type { Bindings } from "../../lib/common/types";
import type { GitHubIssue } from "../../services/github";
import { syncIssueToAsana } from "../../services/sync";

type GitHubIssueEventPayload = {
  action: string;
  issue: GitHubIssue;
  repository: { id: number; full_name: string };
};

const HANDLED_ACTIONS = new Set(["opened", "edited", "closed", "reopened"]);

function hexToBytes(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes.buffer as ArrayBuffer;
}

async function verifySignature(
  secret: string,
  signature: string,
  rawBody: string,
): Promise<boolean> {
  if (!signature.startsWith("sha256=")) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  return crypto.subtle.verify(
    "HMAC",
    key,
    hexToBytes(signature.slice(7)),
    encoder.encode(rawBody),
  );
}

export const githubWebhook = async (c: Context<{ Bindings: Bindings }>) => {
  const rawBody = await c.req.text();
  const signature = c.req.header("X-Hub-Signature-256") ?? "";
  const event = c.req.header("X-GitHub-Event") ?? "";

  const valid = await verifySignature(
    c.env.GITHUB_WEBHOOK_SECRET,
    signature,
    rawBody,
  );
  if (!valid) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  if (event !== "issues") {
    return c.json({ received: true }, 200);
  }

  let payload: GitHubIssueEventPayload;
  try {
    payload = JSON.parse(rawBody) as GitHubIssueEventPayload;
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!HANDLED_ACTIONS.has(payload.action)) {
    return c.json({ received: true }, 200);
  }

  try {
    const db = useDB(c);
    await syncIssueToAsana(db, payload.issue, String(payload.repository.id));
    return c.json({ synced: true }, 200);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};
