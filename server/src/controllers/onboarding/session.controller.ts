import type { Context } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Bindings, Variables } from "../../lib/common/types";
import { encryptToken } from "../../lib/crypto/token-encryption";
import { useDB } from "../../lib/db/db";
import type { TddLayoutState } from "../../lib/onboarding/tdd-types";
import { parseTddLayoutState, parsePlanningBrief, parseTranscript } from "../../lib/onboarding/tdd-types";
import { onboardingSessions } from "../../schema/onboarding-session.model";
import { users } from "../../schema/user.model";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

export const getOnboardingSession = async (c: Context<HonoEnv>) => {
  const userId = c.get("userId");
  const sessionId = c.req.param("sessionId")?.trim();

  if (!sessionId) {
    return c.json({ error: "sessionId is required." }, 400);
  }

  const db = useDB(c);
  const [session] = await db
    .select()
    .from(onboardingSessions)
    .where(and(eq(onboardingSessions.id, sessionId), eq(onboardingSessions.userId, userId)))
    .limit(1);

  if (!session) {
    return c.json({ error: "Session not found." }, 404);
  }

  return c.json({
    id: session.id,
    userId: session.userId,
    transcript: parseTranscript(session.transcript),
    tddLayoutState: parseTddLayoutState(session.tddLayoutState),
    planningBrief: parsePlanningBrief(session.planningBrief),
    status: session.status,
    docUrl: session.docUrl,
    createdAt: session.createdAt?.toISOString() ?? new Date().toISOString(),
  });
};

export const getLatestOnboardingSession = async (c: Context<HonoEnv>) => {
  const userId = c.get("userId");
  const db = useDB(c);

  const [session] = await db
    .select()
    .from(onboardingSessions)
    .where(eq(onboardingSessions.userId, userId))
    .orderBy(desc(onboardingSessions.createdAt))
    .limit(1);

  if (!session) {
    return c.json({ session: null });
  }

  return c.json({
    session: {
      id: session.id,
      userId: session.userId,
      transcript: parseTranscript(session.transcript),
      tddLayoutState: parseTddLayoutState(session.tddLayoutState),
      planningBrief: parsePlanningBrief(session.planningBrief),
      status: session.status,
      docUrl: session.docUrl,
      createdAt: session.createdAt?.toISOString() ?? new Date().toISOString(),
    },
  });
};

type PatchSessionBody = {
  tddLayoutState?: unknown;
  status?: unknown;
  docUrl?: unknown;
};

export const patchOnboardingSession = async (c: Context<HonoEnv>) => {
  const userId = c.get("userId");
  const sessionId = c.req.param("sessionId")?.trim();

  if (!sessionId) {
    return c.json({ error: "sessionId is required." }, 400);
  }

  const raw = (await c.req.json().catch(() => null)) as PatchSessionBody | null;
  if (!raw || typeof raw !== "object") {
    return c.json({ error: "Request body must be a JSON object." }, 400);
  }

  const db = useDB(c);
  const [existing] = await db
    .select()
    .from(onboardingSessions)
    .where(and(eq(onboardingSessions.id, sessionId), eq(onboardingSessions.userId, userId)))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Session not found." }, 404);
  }

  const updates: Partial<{
    tddLayoutState: string;
    status: "INTERVIEWING" | "CANVAS_EDIT" | "CONCLUDED";
    docUrl: string;
  }> = {};

  if (raw.tddLayoutState && typeof raw.tddLayoutState === "object") {
    const layout = raw.tddLayoutState as TddLayoutState;
    if (Array.isArray(layout.blocks)) {
      updates.tddLayoutState = JSON.stringify(layout);
    }
  }

  if (
    raw.status === "INTERVIEWING" ||
    raw.status === "CANVAS_EDIT" ||
    raw.status === "CONCLUDED"
  ) {
    updates.status = raw.status;
  }

  if (typeof raw.docUrl === "string") {
    updates.docUrl = raw.docUrl.trim();
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No valid fields to update." }, 400);
  }

  await db
    .update(onboardingSessions)
    .set(updates)
    .where(eq(onboardingSessions.id, sessionId));

  return c.json({ ok: true });
};

export const postCreateOnboardingSession = async (c: Context<HonoEnv>) => {
  const userId = c.get("userId");
  const db = useDB(c);
  const sessionId = `obs_${nanoid()}`;

  await db.insert(onboardingSessions).values({
    id: sessionId,
    userId,
    transcript: JSON.stringify([]),
    status: "INTERVIEWING",
  });

  return c.json({ sessionId, status: "INTERVIEWING" });
};

type GoogleOAuthBody = {
  userId?: unknown;
  accessToken?: unknown;
  refreshToken?: unknown;
  expiresIn?: unknown;
};

export const postGoogleOAuthComplete = async (c: Context<HonoEnv>) => {
  const body = (await c.req.json().catch(() => null)) as GoogleOAuthBody | null;

  if (!body?.userId || !body.accessToken) {
    return c.json({ error: "userId and accessToken are required." }, 400);
  }

  const userId = String(body.userId);
  const accessToken = String(body.accessToken);
  const refreshToken = body.refreshToken ? String(body.refreshToken) : null;
  const expiresIn = typeof body.expiresIn === "number" ? body.expiresIn : 3600;

  const encryptionKey = c.env.ENCRYPTION_KEY ?? "";
  const encryptedAccess = await encryptToken(accessToken, encryptionKey);
  const encryptedRefresh = refreshToken
    ? await encryptToken(refreshToken, encryptionKey)
    : null;
  const expiryMs = Date.now() + expiresIn * 1000;

  const db = useDB(c);
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existing) {
    return c.json({ error: "User not found." }, 404);
  }

  await db
    .update(users)
    .set({
      encryptedGoogleAccessToken: encryptedAccess,
      encryptedGoogleRefreshToken: encryptedRefresh,
      googleTokenExpiry: expiryMs,
    })
    .where(eq(users.id, userId));

  return c.json({ ok: true });
};

export const getGoogleTokens = async (c: Context<HonoEnv>) => {
  const userId = c.get("userId");
  const db = useDB(c);

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
    return c.json({ connected: false });
  }

  return c.json({
    connected: true,
    encryptedGoogleAccessToken: user.encryptedGoogleAccessToken,
    encryptedGoogleRefreshToken: user.encryptedGoogleRefreshToken,
    googleTokenExpiry: user.googleTokenExpiry,
  });
};
