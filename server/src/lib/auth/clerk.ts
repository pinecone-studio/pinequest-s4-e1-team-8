import type { Context } from "hono";
import type { Bindings } from "../common/types";

type JwkKey = {
  kty: string;
  kid?: string;
  n?: string;
  e?: string;
  alg?: string;
  use?: string;
  [k: string]: unknown;
};

type ClerkJwtPayload = {
  sub: string;
  iss: string;
  iat: number;
  exp: number;
  azp?: string;
  [key: string]: unknown;
};

function getJwksUrl(publishableKey: string): string {
  const instanceId = publishableKey.replace(/^pk_(test|live)_/, "");
  const domain = atob(instanceId).replace(/\.$/, "");
  return `https://${domain}/.well-known/jwks.json`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCryptoKey = any;

async function importPublicKey(jwk: JwkKey): Promise<CryptoKey> {
  const subtle = crypto.subtle as AnyCryptoKey;
  return subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, [
    "verify",
  ]) as Promise<CryptoKey>;
}

function base64UrlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export async function verifyClerkJwt(
  token: string,
  publishableKey: string,
): Promise<ClerkJwtPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const header = JSON.parse(atob(headerB64.replace(/-/g, "+").replace(/_/g, "/"))) as {
      kid?: string;
    };

    const jwksUrl = getJwksUrl(publishableKey);
    const jwksResponse = await fetch(jwksUrl);
    if (!jwksResponse.ok) return null;

    const jwks = (await jwksResponse.json()) as { keys: JwkKey[] };
    const jwk = header.kid
      ? jwks.keys.find((k) => k.kid === header.kid)
      : jwks.keys[0];

    if (!jwk) return null;

    const key = await importPublicKey(jwk);
    const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlDecode(sigB64);

    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, signedData);
    if (!valid) return null;

    const payload = JSON.parse(
      atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")),
    ) as ClerkJwtPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export function extractBearerToken(c: Context<{ Bindings: Bindings }>): string | null {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export async function getAuthenticatedUserId(
  c: Context<{ Bindings: Bindings }>,
): Promise<string | null> {
  const token = extractBearerToken(c);
  if (!token) return null;

  const publishableKey = c.env.CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) return null;

  const payload = await verifyClerkJwt(token, publishableKey);
  return payload?.sub ?? null;
}
