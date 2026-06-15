import { eq } from "drizzle-orm";
import type { Bindings } from "../common/types";
import { useDB } from "../db/db";
import { decryptToken, encryptToken } from "../crypto/token-encryption";

type Db = ReturnType<typeof useDB>;
import { users } from "../../schema/schema";

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

export async function saveGoogleTokens(
  db: Db,
  userId: string,
  env: Bindings,
  tokens: {
    accessToken: string;
    refreshToken?: string | null;
    expiresIn: number;
  },
) {
  const encryptionKey = env.ENCRYPTION_KEY ?? "";
  const encryptedAccess = await encryptToken(tokens.accessToken, encryptionKey);
  const encryptedRefresh = tokens.refreshToken
    ? await encryptToken(tokens.refreshToken, encryptionKey)
    : null;
  const expiryMs = Date.now() + tokens.expiresIn * 1000;

  await db
    .update(users)
    .set({
      encryptedGoogleAccessToken: encryptedAccess,
      encryptedGoogleRefreshToken: encryptedRefresh,
      googleTokenExpiry: expiryMs,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function getGoogleAccessToken(
  db: Db,
  userId: string,
  env: Bindings,
): Promise<string | null> {
  const [user] = await db
    .select({
      encryptedGoogleAccessToken: users.encryptedGoogleAccessToken,
      encryptedGoogleRefreshToken: users.encryptedGoogleRefreshToken,
      googleTokenExpiry: users.googleTokenExpiry,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.encryptedGoogleAccessToken) {
    return null;
  }

  const encryptionKey = env.ENCRYPTION_KEY ?? "";
  const expiryMs = user.googleTokenExpiry ?? 0;

  if (expiryMs - Date.now() > 60_000) {
    return decryptToken(user.encryptedGoogleAccessToken, encryptionKey);
  }

  if (!user.encryptedGoogleRefreshToken) {
    return null;
  }

  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return null;
  }

  const refreshToken = await decryptToken(
    user.encryptedGoogleRefreshToken,
    encryptionKey,
  );

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!tokenRes.ok) {
    return null;
  }

  const refreshed = (await tokenRes.json()) as GoogleTokenResponse;

  await saveGoogleTokens(db, userId, env, {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? refreshToken,
    expiresIn: refreshed.expires_in,
  });

  return refreshed.access_token;
}

export async function hasGoogleConnection(db: Db, userId: string) {
  const [user] = await db
    .select({ encryptedGoogleAccessToken: users.encryptedGoogleAccessToken })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return Boolean(user?.encryptedGoogleAccessToken);
}

export async function clearGoogleTokens(
  db: Db,
  userId: string,
  env: Bindings,
) {
  const [user] = await db
    .select({
      encryptedGoogleRefreshToken: users.encryptedGoogleRefreshToken,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.encryptedGoogleRefreshToken) {
    const encryptionKey = env.ENCRYPTION_KEY ?? "";
    const refreshToken = await decryptToken(
      user.encryptedGoogleRefreshToken,
      encryptionKey,
    );

    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: refreshToken }).toString(),
    }).catch(() => undefined);
  }

  await db
    .update(users)
    .set({
      encryptedGoogleAccessToken: null,
      encryptedGoogleRefreshToken: null,
      googleTokenExpiry: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
